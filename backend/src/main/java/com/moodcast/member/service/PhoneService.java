package com.moodcast.member.service;

import com.solapi.sdk.SolapiClient;
import com.solapi.sdk.message.exception.SolapiEmptyResponseException;
import com.solapi.sdk.message.exception.SolapiMessageNotReceivedException;
import com.solapi.sdk.message.model.Message;
import com.solapi.sdk.message.service.DefaultMessageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class PhoneService {
    @Value("${solapi.api-key}")
    private String apiKey;

    @Value("${solapi.api-secret}")
    private String apiSecret;

    @Value("${solapi.sender-number}")
    private String senderNumber;

    public void sendSignupAuthCode(String phone, String authCode) {
        DefaultMessageService messageService = SolapiClient.INSTANCE.createInstance(apiKey, apiSecret);
        Message message = new Message();
        message.setFrom(senderNumber);
        message.setTo(phone);
        message.setText("[MoodCast] 인증번호는 " + authCode + "입니다. 3분 내 입력해주세요.");

        try {
            messageService.send(message);
        } catch(SolapiMessageNotReceivedException e) {
            throw new IllegalStateException("문자 발송을 실패했습니다.");
        } catch (Exception e) {
            throw new IllegalStateException("문자 발송 중 오류가 발생했습니다.");
        }
    }



}
