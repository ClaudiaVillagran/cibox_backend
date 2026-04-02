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

export const applyCiboxPlusDiscount = (price, product, user) => {
  const discountPercent = Number(process.env.CIBOX_PLUS_DISCOUNT || 0);

  const hasActiveSubscription =
    user?.subscription?.type === 'cibox_plus' &&
    user?.subscription?.status === 'active';

  const productAllowsDiscount = product?.cibox_plus?.enabled === true;

  if (!hasActiveSubscription || !productAllowsDiscount || discountPercent <= 0) {
    return {
      original_price: price,
      final_price: price,
      discount_applied: false,
      discount_percent: 0,
      discount_amount: 0
    };
  }

  const discountAmount = Math.round(price * (discountPercent / 100));
  const finalPrice = price - discountAmount;

  return {
    original_price: price,
    final_price: finalPrice,
    discount_applied: true,
    discount_percent: discountPercent,
    discount_amount: discountAmount
  };
};

export const calculateItemPricing = ({ tiers, quantity, product, user }) => {
  const selectedTier = getPriceTierByQuantity(tiers, quantity);

  const discountResult = applyCiboxPlusDiscount(
    selectedTier.price,
    product,
    user
  );

  return {
    unit_price: discountResult.final_price,
    original_unit_price: discountResult.original_price,
    tier_label: selectedTier.label,
    min_qty_applied: selectedTier.min_qty,
    quantity,
    discount_applied: discountResult.discount_applied,
    discount_percent: discountResult.discount_percent,
    discount_amount_per_unit: discountResult.discount_amount,
    subtotal: discountResult.final_price * quantity,
    original_subtotal: discountResult.original_price * quantity
  };
};