package com.moodcast;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.mybatis.spring.annotation.MapperScan;

@SpringBootApplication
@MapperScan("com.moodcast.repository")
public class MoodCastApplication {

  public static void main(String[] args) {
    SpringApplication.run(MoodCastApplication.class, args);
  }
}
