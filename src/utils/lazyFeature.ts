import { showToast } from "../ui/ToastManager";

/** Share concurrent imports and allow another attempt after a failed download. */
export function lazyFeature<T>(name: string, importer: () => Promise<T>) {
  let pending: Promise<T> | undefined;
  let value: T | undefined;
  return {
    peek: () => value,
    load: () => {
      if (!pending) {
        showToast(`Loading ${name}…`, "info");
        pending = importer().then((loaded) => {
          value = loaded;
          return loaded;
        }).catch((error) => {
          pending = undefined;
          showToast(`Could not load ${name}. Try the action again.`, "error");
          throw error;
        });
      }
      return pending;
    },
  };
}

export async function runFeature(action: () => Promise<unknown>) {
  try {
    await action();
  } catch (error) {
    console.error("Feature action failed", error);
    showToast("The action failed. Please try again.", "error");
  }
}
