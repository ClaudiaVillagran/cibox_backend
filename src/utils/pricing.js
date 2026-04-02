export const getPriceTierByQuantity = (tiers, quantity) => {
  if (!tiers || tiers.length === 0) {
    throw new Error('El producto no tiene tiers de precio');
  }

  const sortedTiers = [...tiers].sort((a, b) => a.min_qty - b.min_qty);

  let selectedTier = sortedTiers[0];

  for (const tier of sortedTiers) {
    if (quantity >= tier.min_qty) {
      selectedTier = tier;
    }
  }

  return selectedTier;
};

export const calculateItemPricing = (tiers, quantity) => {
  const selectedTier = getPriceTierByQuantity(tiers, quantity);

  return {
    unit_price: selectedTier.price,
    tier_label: selectedTier.label,
    min_qty_applied: selectedTier.min_qty,
    quantity,
    subtotal: selectedTier.price * quantity
  };
};