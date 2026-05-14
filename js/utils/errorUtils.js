export async function tryCatch(asyncFn, errorMessage = "An error occurred") {
  try {
    return await asyncFn();
  } catch (error) {
    console.error(errorMessage, error);
    throw error;
  }
}

export function asyncHandler(fn) {
  return function (...args) {
    Promise.resolve(fn.apply(this, args)).catch((error) => {
      console.error("Async handler error:", error);
    });
  };
}
