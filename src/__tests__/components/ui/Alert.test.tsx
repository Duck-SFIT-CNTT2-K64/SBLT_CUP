/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { Alert } from "@/components/ui/Alert";

describe("Alert", () => {
  test("renders with message", () => {
    render(<Alert variant="error" message="Test error" />);
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  test("renders success variant", () => {
    render(<Alert variant="success" message="Success!" />);
    expect(screen.getByText("Success!")).toBeInTheDocument();
  });

  test("renders warning variant", () => {
    render(<Alert variant="warning" message="Warning!" />);
    expect(screen.getByText("Warning!")).toBeInTheDocument();
  });

  test("calls onDismiss when dismiss button clicked", () => {
    const onDismiss = jest.fn();
    render(<Alert variant="error" message="Dismiss me" onDismiss={onDismiss} />);
    const dismissButton = screen.getByRole("button");
    fireEvent.click(dismissButton);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
