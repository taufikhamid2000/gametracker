import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

// Mock the supabase client actually used by both forms
const signUp = jest.fn();
const signInWithPassword = jest.fn();
jest.mock("@/utils/supabase/client", () => ({
  createClient: () => ({
    auth: { signUp, signInWithPassword },
  }),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
  })),
  redirect: jest.fn(),
}));

// Import components after mocks
import SignUpForm from "@/app/auth/signup/components/signup-form";
import SignInForm from "@/app/auth/signin/components/signin-form";
import { en } from "@/lib/dictionaries/en";

describe("Authentication Flow", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("User can register and then login with new account", async () => {
    // Step 1: Set up the test user data
    const testUser = {
      firstName: "Test",
      lastName: "User",
      email: "test.user@example.com",
      password: "password123",
    };

    // Step 2: Mock successful signup (signup-form also immediately signs in)
    signUp.mockResolvedValueOnce({ error: null });
    signInWithPassword.mockResolvedValueOnce({ error: null });

    // Step 3: Render signup form and fill it out
    const { unmount } = render(<SignUpForm brand={en.nav.brand} dict={{ signup: en.signup, signin: en.signin, validation: en.validation }} authDict={en.auth} />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/First Name/i), testUser.firstName);
    await user.type(screen.getByLabelText(/Last Name/i), testUser.lastName);
    await user.type(screen.getByLabelText(/Email/i), testUser.email);
    await user.type(screen.getByLabelText("Password"), testUser.password);
    await user.click(screen.getByRole("button", { name: /Sign up/i }));

    // Verify signup was called with correct data
    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith({
        email: testUser.email,
        password: testUser.password,
        options: {
          data: {
            first_name: testUser.firstName,
            last_name: testUser.lastName,
            role: "user",
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_REDIRECT_URL}/dashboard`,
        },
      });
    });

    // Step 4: Clean up signup component
    unmount();

    // Step 5: Mock successful login (separately from signup's own call)
    signInWithPassword.mockResolvedValueOnce({ error: null });

    // Step 6: Render login form and fill it out
    render(<SignInForm brand={en.nav.brand} dict={{ signin: en.signin, validation: en.validation }} authDict={en.auth} />);

    await user.type(screen.getByLabelText(/Email/i), testUser.email);
    await user.type(screen.getByLabelText("Password"), testUser.password);
    await user.click(screen.getByRole("button", { name: /Sign in/i }));

    // Verify login was called with correct data
    await waitFor(() => {
      expect(signInWithPassword).toHaveBeenCalledWith({
        email: testUser.email,
        password: testUser.password,
      });
    });
  });
});
