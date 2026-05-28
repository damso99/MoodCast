package com.moodcast.controller;

import com.moodcast.service.FileUploadService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@CrossOrigin(
        origins = {"http://localhost:5173", "http://127.0.0.1:5173"},
        allowedHeaders = "*",
        methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH, RequestMethod.OPTIONS},
        allowCredentials = "true"
)
@RequestMapping("/upload")
public class FileUploadController {
    private final FileUploadService fileUploadService;

    // 업로드/삭제에 필요한 실제 처리는 Service가 맡도록 분리함
    public FileUploadController(FileUploadService fileUploadService) {
        this.fileUploadService = fileUploadService;
    }

    // 프론트에서 이미지를 보내면 S3 업로드 결과(url, filename, key)를 돌려주는 API임
    @PostMapping
    public ResponseEntity<Map<String, String>> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "post-images") String folderType,
            HttpServletRequest request
    ) {
        return ResponseEntity.ok(fileUploadService.uploadImage(file, folderType, baseUrl(request)));
    }

    // 저장된 파일명을 받아 S3에서 삭제하는 API임
    @DeleteMapping("/{filename}")
    public ResponseEntity<Map<String, Boolean>> delete(
            @PathVariable String filename,
            @RequestParam(defaultValue = "post-images") String folderType
    ) {
        return ResponseEntity.ok(Map.of("deleted", fileUploadService.deleteImage(filename, folderType)));
    }

    // 브라우저가 보는 주소는 이 엔드포인트임. 내부에서 S3 이미지를 직접 읽어서 내려줌
    @GetMapping("/view")
    public ResponseEntity<byte[]> view(@RequestParam String key) {
        String decodedKey = URLDecoder.decode(key, StandardCharsets.UTF_8);
        return fileUploadService.loadImage(decodedKey);
    }

    // 예전 DB에 남아 있는 /uploads/... 주소도 같은 이미지로 열어줌
    @GetMapping("/uploads/**")
    public ResponseEntity<byte[]> legacyUploads(HttpServletRequest request) {
        String requestUri = request.getRequestURI();
        String prefix = request.getContextPath() + "/upload/";
        String key = requestUri.startsWith(prefix) ? requestUri.substring(prefix.length()) : requestUri;
        return fileUploadService.loadImage(key);
    }

    // 예전 로컬 uploads 폴더에 남아 있는 파일을 S3로 옮기는 이관용 API임
    // deleteAfterUpload=true 로 보내면 업로드 후 로컬 파일도 지움
    @PostMapping("/migrate-local")
    public ResponseEntity<Map<String, Object>> migrateLocalUploads(
            @RequestParam(defaultValue = "false") boolean deleteAfterUpload,
            HttpServletRequest request
    ) {
        return ResponseEntity.ok(fileUploadService.migrateLocalUploadsAndDatabase(deleteAfterUpload));
    }

    @PostMapping("/rewrite-s3-links")
    public ResponseEntity<Map<String, Object>> rewriteS3Links(HttpServletRequest request) {
        return ResponseEntity.ok(fileUploadService.rewriteImageUrlsToPublicS3Urls(baseUrl(request)));
    }

    private String baseUrl(HttpServletRequest request) {
        return request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort();
    }
}
