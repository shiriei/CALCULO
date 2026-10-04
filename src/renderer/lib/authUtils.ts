export const validateEmail = (e: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
};
