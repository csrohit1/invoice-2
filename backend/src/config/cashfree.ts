import { Cashfree, CFEnvironment } from "cashfree-pg";

export const cashfreeClient = new Cashfree(
  process.env.NODE_ENV === "production"
    ? CFEnvironment.PRODUCTION
    : CFEnvironment.SANDBOX,
  process.env.CASHFREE_CLIENT_ID,
  process.env.CASHFREE_APP_SECRET,
);
export const cashfreeRedirectBase =
  process.env.CASHFREE_REDIRECT_BASE ||
  "https://sandbox.cashfree.com/pg/orders";
