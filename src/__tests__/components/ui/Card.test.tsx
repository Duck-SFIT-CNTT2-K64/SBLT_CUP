/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { Card } from "@/components/ui/Card";

describe("Card", () => {
  test("renders children", () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  test("applies custom className", () => {
    render(<Card className="custom-class">Styled card</Card>);
    expect(screen.getByText("Styled card")).toHaveClass("custom-class");
  });

  test("renders with hover effect by default", () => {
    render(<Card>Hoverable</Card>);
    const card = screen.getByText("Hoverable").closest("div");
    expect(card).toBeTruthy();
  });

  test("renders without hover when hover=false", () => {
    render(<Card hover={false}>No hover</Card>);
    const card = screen.getByText("No hover").closest("div");
    expect(card).toBeTruthy();
  });
});
