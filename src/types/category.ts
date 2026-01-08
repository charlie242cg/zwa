export interface Category {
    id: string;
    name: string;
    icon?: string;
    display_order: number;
    is_active: boolean;
    created_by?: string;
    created_at: string;
}

export interface CategoryWithCount extends Category {
    product_count?: number;
}
