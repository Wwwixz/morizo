package ru.morizo.backend.entity;

public enum AgeGroup {
    /** 14–15 лет */
    AGE_14_15("14-15 лет"),
    /** 16–17 лет */
    AGE_16_17("16-17 лет");

    private final String label;

    AgeGroup(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
