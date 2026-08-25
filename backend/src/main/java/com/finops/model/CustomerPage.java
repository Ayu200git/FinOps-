package com.finops.model;

import java.util.List;

public class CustomerPage {
    private final List<Customer> items;
    private final int page;
    private final int size;
    private final int totalItems;

    public CustomerPage(List<Customer> items, int page, int size, int totalItems) {
        this.items = items;
        this.page = page;
        this.size = size;
        this.totalItems = totalItems;
    }

    public List<Customer> getItems() { return items; }
    public int getPage() { return page; }
    public int getSize() { return size; }
    public int getTotalItems() { return totalItems; }
    public int getTotalPages() { return (int) Math.ceil((double) totalItems / size); }
}