import "@testing-library/jest-dom";

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveClass(...classNames: string[]): R;
      toBeDisabled(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveTextContent(text: string | RegExp): R;
      toBeVisible(): R;
      toHaveFocus(): R;
    }
  }
}
