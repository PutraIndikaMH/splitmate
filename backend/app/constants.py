# ============================================
# SplitMate — Centralized Constants
# ============================================

# Group category icons (used in group creation/display)
GROUP_CATEGORY_ICONS = {
    "trip": "flight",
    "kosan": "home",
    "couple": "favorite",
    "other": "category",
}

# Expense category icons (used in expense creation/display)
EXPENSE_CATEGORY_ICONS = {
    "makanan": "restaurant",
    "transportasi": "directions_car",
    "akomodasi": "hotel",
    "hiburan": "movie",
    "belanja": "shopping_bag",
    "travel": "flight",
    "tagihan": "receipt_long",
    "lainnya": "category",
}

# Valid group categories
VALID_GROUP_CATEGORIES = list(GROUP_CATEGORY_ICONS.keys())

# Valid expense categories
VALID_EXPENSE_CATEGORIES = list(EXPENSE_CATEGORY_ICONS.keys())
