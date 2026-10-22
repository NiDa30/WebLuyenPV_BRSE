package com.brse.trainer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@org.springframework.scheduling.annotation.EnableScheduling
@SpringBootApplication
public class TrainerApplication {
    public static void main(String[] args) { SpringApplication.run(TrainerApplication.class, args); }
}
