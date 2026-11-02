import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthForm from "@/component/auth/AuthForm";
import useAuthStore from "@/store/useAuthStore";
import { renderWithIntl } from "@/test-utils";

const replace = jest.fn();
let next: string | null = null;

jest.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace, push: jest.fn() }),
}));
jest.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: () => next }),
}));

beforeEach(() => {
  replace.mockClear();
  next = null;
  act(() => useAuthStore.setState({ user: null }));
});

describe("AuthForm", () => {
  it("shows validation errors for an empty login", async () => {
    const user = userEvent.setup();
    renderWithIntl(<AuthForm />);
    await user.click(document.querySelector("form button[type=submit]")!);
    expect((await screen.findAllByRole("alert")).length).toBe(2);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("logs in with valid credentials and redirects", async () => {
    const user = userEvent.setup();
    renderWithIntl(<AuthForm />);
    await user.type(screen.getByLabelText("Phone or email"), "09450012345");
    await user.type(screen.getByLabelText("Password"), "secret1");
    await user.click(document.querySelector("form button[type=submit]")!);

    await waitFor(() => expect(useAuthStore.getState().user?.identifier).toBe("09450012345"));
    expect(replace).toHaveBeenCalledWith("/profile");
  });

  it("redirects to a safe ?next target but ignores external ones", async () => {
    next = "/checkout";
    const user = userEvent.setup();
    renderWithIntl(<AuthForm />);
    await user.type(screen.getByLabelText("Phone or email"), "a@b.co");
    await user.type(screen.getByLabelText("Password"), "secret1");
    await user.click(document.querySelector("form button[type=submit]")!);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/checkout"));
  });

  it("switches to sign up and flags mismatched passwords", async () => {
    const user = userEvent.setup();
    renderWithIntl(<AuthForm />);
    await user.click(screen.getByRole("tab", { name: "Sign up" }));
    await user.type(await screen.findByLabelText("Full name"), "Aung");
    await user.type(screen.getByLabelText("Phone or email"), "a@b.co");
    await user.type(screen.getByLabelText("Password"), "secret1");
    await user.type(screen.getByLabelText("Confirm password"), "secret2");
    await user.click(document.querySelector("form button[type=submit]")!);
    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
