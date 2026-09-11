import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import SignUpForm from "@/app/auth/signup/components/signup-form";
import { en } from "@/lib/dictionaries/en";

// Mock the next/navigation hooks
const pushMock = jest.fn();
const refreshMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

// Mock the supabase client actually used by signup-form.tsx
const signUp = jest.fn();
const signInWithPassword = jest.fn();
jest.mock("@/utils/supabase/client", () => ({
  createClient: () => ({
    auth: { signUp, signInWithPassword },
  }),
}));

describe("SignUp Form", () => {
  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks();
  });

  test("renders sign up form with all fields", () => {
    render(<SignUpForm brand={en.nav.brand} dict={{ signup: en.signup, signin: en.signin, validation: en.validation }} authDict={en.auth} />);

    // Check form elements exist
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Sign up/i })
    ).toBeInTheDocument();
  });

  test("validates required fields", async () => {
    render(<SignUpForm brand={en.nav.brand} dict={{ signup: en.signup, signin: en.signin, validation: en.validation }} authDict={en.auth} />);

    const user = userEvent.setup();

    // Submit without filling form
    await user.click(screen.getByRole("button", { name: /Sign up/i }));

    // Check error messages
    await waitFor(() => {
      expect(
        screen.getByText(/first name must be at least 2 characters/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/last name must be at least 2 characters/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/please enter a valid email/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/password must be at least 6 characters/i)
      ).toBeInTheDocument();
    });
  });
  test("submits the form with valid data", async () => {
    // Mock the successful sign up + immediate sign in response
    signUp.mockResolvedValueOnce({ error: null });
    signInWithPassword.mockResolvedValueOnce({ error: null });

    render(<SignUpForm brand={en.nav.brand} dict={{ signup: en.signup, signin: en.signin, validation: en.validation }} authDict={en.auth} />);

    const user = userEvent.setup();

    // Fill the form with valid data
    await user.type(screen.getByLabelText(/First Name/i), "John");
    await user.type(screen.getByLabelText(/Last Name/i), "Doe");
    await user.type(screen.getByLabelText(/Email/i), "john.doe@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");

    // Submit the form
    await user.click(screen.getByRole("button", { name: /Sign up/i }));

    // Verify supabase.auth.signUp was called with the right data
    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith({
        email: "john.doe@example.com",
        password: "password123",
        options: {
          data: {
            first_name: "John",
            last_name: "Doe",
            role: "user",
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_REDIRECT_URL}/dashboard`,
        },
      });
    }); // Verify signup also signs the user in and redirects to dashboard
    await waitFor(() => {
      expect(signInWithPassword).toHaveBeenCalledWith({
        email: "john.doe@example.com",
        password: "password123",
      });
      expect(refreshMock).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith("/dashboard");
    });
  });
  test("displays an error message when signup fails", async () => {
    // Mock a failed sign up response
    signUp.mockResolvedValueOnce({
      error: { message: "This email is already registered" },
    });

    render(<SignUpForm brand={en.nav.brand} dict={{ signup: en.signup, signin: en.signin, validation: en.validation }} authDict={en.auth} />);

    const user = userEvent.setup();

    // Fill the form with valid data
    await user.type(screen.getByLabelText(/First Name/i), "John");
    await user.type(screen.getByLabelText(/Last Name/i), "Doe");
    await user.type(screen.getByLabelText(/Email/i), "john.doe@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");

    // Submit the form
    await user.click(screen.getByRole("button", { name: /Sign up/i }));

    // Check if error message is displayed
    await waitFor(() => {
      expect(
        screen.getByText("This email is already registered")
      ).toBeInTheDocument();
    });
  });
});
