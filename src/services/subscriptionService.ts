import Purchases from 'react-native-purchases';

// Configure RevenueCat with public SDK key (add to app.json: extra.revenueCatPublicKey)
const configureRevenueCat = async () => {
  await Purchases.setup('your_public_sdk_key'); // Replace with real key
  await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
};

export const getOfferings = async () => {
  const offerings = await Purchases.getOfferings();
  return offerings.current?.availablePackages || [];
};

export const purchasePackage = async (pkg: Purchases.Package) => {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
};

export const checkTrialStatus = async () => {
  const customerInfo = await Purchases.getCustomerInfo();
  // Check for 3-day trial entitlement
  const trialEntitlement = customerInfo.entitlements.active['trial'];
  return { hasTrial: !!trialEntitlement, expiry: trialEntitlement?.expirationDate };
};

// Sync to Supabase after purchase
const syncSubscription = async (customerInfo: Purchases.CustomerInfo, userId: string) => {
  const { error } = await supabase.from('profiles').update({
    subscription_status: customerInfo.entitlements.active['pro'] ? 'active' : 'inactive',
    subscription_expiry: customerInfo.entitlements.active['pro']?.expirationDate
  }).eq('id', userId);
  if (error) console.error('Sync error:', error);
};

// Define packages in RevenueCat dashboard: trial_3d, monthly_599, etc.
export const PACKAGE_IDS = {
  TRIAL: 'trial_3d',
  MONTHLY: 'monthly_599',
  QUARTERLY: 'quarterly_1199',
  HALFYEAR: 'halfyear_2399',
  YEARLY: 'yearly_4799'
};
