import { lazy } from 'react';

/**
 * Resilient import helper that retries dynamic chunk fetches on failure (e.g. transient network
 * drops or browser cache mismatches in production) before escalating, ensuring rock-solid Suspense stability.
 */
function retryImport<T>(factory: () => Promise<T>, retries = 2, interval = 400): Promise<T> {
  return new Promise((resolve, reject) => {
    let attempt = 0;
    function execute() {
      factory()
        .then(resolve)
        .catch((err) => {
          attempt++;
          if (attempt <= retries) {
            console.warn(`[LazyLoader] Retrying chunk import (${attempt}/${retries})...`, err);
            setTimeout(execute, interval * attempt);
          } else {
            console.error('[LazyLoader] Failed to import chunk after retries:', err);
            reject(err);
          }
        });
    }
    execute();
  });
}

// =========================================================================
// Centralized Lazy Loaded Components for App.tsx with Production Suspense Safety
// =========================================================================

export const ProductDetailsPage = lazy(() =>
  retryImport(() =>
    import('../components/ProductDetailsPage').then((m) => ({
      default: m.ProductDetailsPage || m.default,
    }))
  )
);

export const CheckoutPage = lazy(() =>
  retryImport(() =>
    import('../components/CheckoutPage').then((m) => ({
      default: m.CheckoutPage || m.default,
    }))
  )
);

export const CustomerOrderTrackingPage = lazy(() =>
  retryImport(() =>
    import('../components/CustomerOrderTrackingPage').then((m) => ({
      default: m.CustomerOrderTrackingPage || m.TrackOrderPage || m.default,
    }))
  )
);

export const QuickViewModal = lazy(() =>
  retryImport(() =>
    import('../components/QuickViewModal').then((m) => ({
      default: m.QuickViewModal || m.default,
    }))
  )
);

export const WishlistDrawer = lazy(() =>
  retryImport(() =>
    import('../components/WishlistDrawer').then((m) => ({
      default: m.WishlistDrawer || m.default,
    }))
  )
);

export const AdminDeveloperAdvisor = lazy(() =>
  retryImport(() =>
    import('../components/AdminDeveloperAdvisor').then((m) => ({
      default: m.AdminDeveloperAdvisor || m.default,
    }))
  )
);

export const AdminOrders = lazy(() =>
  retryImport(() =>
    import('../components/AdminOrders').then((m) => ({
      default: m.AdminOrders || m.default,
    }))
  )
);

export const AdminProductForm = lazy(() =>
  retryImport(() =>
    import('../components/AdminProductForm').then((m) => ({
      default: m.AdminProductForm || m.default,
    }))
  )
);

export const AdminProductList = lazy(() =>
  retryImport(() =>
    import('../components/AdminProductList').then((m) => ({
      default: m.AdminProductList || m.default,
    }))
  )
);

export const AdminSettings = lazy(() =>
  retryImport(() =>
    import('../components/AdminSettings').then((m) => ({
      default: m.AdminSettings || m.default,
    }))
  )
);

export const AdminLogin = lazy(() =>
  retryImport(() =>
    import('../components/AdminLogin').then((m) => ({
      default: m.AdminLogin || m.default,
    }))
  )
);

export const SupabaseCodeModal = lazy(() =>
  retryImport(() =>
    import('../components/SupabaseCodeModal').then((m) => ({
      default: m.SupabaseCodeModal || m.default,
    }))
  )
);

export const AdminCopilotModal = lazy(() =>
  retryImport(() =>
    import('../components/AdminCopilotModal').then((m) => ({
      default: m.AdminCopilotModal || m.default,
    }))
  )
);
