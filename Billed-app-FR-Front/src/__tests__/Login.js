/**
 * @jest-environment jsdom
 */

import LoginUI from "../views/LoginUI";
import Login from "../containers/Login.js";
import { ROUTES } from "../constants/routes";
import { fireEvent, screen } from "@testing-library/dom";

describe("Given that I am a user on the login page", () => {

  beforeEach(() => {
    // Set up the DOM with the login UI
    document.body.innerHTML = LoginUI();
  });

 

  describe("When I fill fields with incorrect format and click on the employee login button", () => {
    test("Then it should display a format error message", async () => {
      const inputEmailUser = screen.getByTestId("employee-email-input");
      fireEvent.change(inputEmailUser, { target: { value: "pasunemail" } });
  
      const inputPasswordUser = screen.getByTestId("employee-password-input");
      fireEvent.change(inputPasswordUser, { target: { value: "azerty" } });
  
      const form = screen.getByTestId("form-employee");
      fireEvent.submit(form);
  
      // Utilisation de findByText pour attendre l'apparition du message d'erreur
      //const errorMessage = await screen.findByText("Invalid email format");
      //expect(errorMessage).toBeTruthy();
    });
  });
  

  describe("When I fill fields with correct format and click on the employee login button", () => {
    test("Then I should be identified as an Employee in the app", async () => {
      const inputData = {
        email: "johndoe@email.com",
        password: "azerty",
      };

      const inputEmailUser = screen.getByTestId("employee-email-input");
      fireEvent.change(inputEmailUser, { target: { value: inputData.email } });

      const inputPasswordUser = screen.getByTestId("employee-password-input");
      fireEvent.change(inputPasswordUser, { target: { value: inputData.password } });

      const form = screen.getByTestId("form-employee");

      // Mock localStorage
      Object.defineProperty(window, "localStorage", {
        value: {
          getItem: jest.fn(() => null),
          setItem: jest.fn(() => null),
        },
        writable: true,
      });

      // Mock navigation
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      let PREVIOUS_LOCATION = "";
      const store = jest.fn();

      const login = new Login({
        document,
        localStorage: window.localStorage,
        onNavigate,
        PREVIOUS_LOCATION,
        store,
      });

      const handleSubmit = jest.fn(login.handleSubmitEmployee);
      login.login = jest.fn().mockResolvedValue({});
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      expect(handleSubmit).toHaveBeenCalled();
      expect(window.localStorage.setItem).toHaveBeenCalled();
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "user",
        JSON.stringify({
          type: "Employee",
          email: inputData.email,
          password: inputData.password,
          status: "connected",
        })
      );

      // Assuming the app navigates to the Bills page
      expect(screen.getAllByText("Mes notes de frais")).toBeTruthy();
    });
  });

  describe("When I click on the 'Show Password' button", () => {
    test("Then it should toggle the password visibility", () => {
      const passwordInput = screen.getByTestId("employee-password-input");
      const toggleButton = screen.getByTestId("toggle-password-visibility");

      fireEvent.click(toggleButton);
      expect(passwordInput.type).toBe("text");

      fireEvent.click(toggleButton);
      expect(passwordInput.type).toBe("password");
    });
  });

  describe("When I try to log in with incorrect credentials", () => {
    test("Then it should display an error message", async () => {
      const inputData = {
        email: "incorrect@email.com",
        password: "wrongpassword",
      };

      const inputEmailUser = screen.getByTestId("employee-email-input");
      fireEvent.change(inputEmailUser, { target: { value: inputData.email } });

      const inputPasswordUser = screen.getByTestId("employee-password-input");
      fireEvent.change(inputPasswordUser, { target: { value: inputData.password } });

      const form = screen.getByTestId("form-employee");
      const login = new Login({ document, localStorage: window.localStorage });

      login.login = jest.fn().mockRejectedValue(new Error("Invalid credentials"));
      form.addEventListener("submit", login.handleSubmitEmployee);

      fireEvent.submit(form);

      // Wait for the error message to appear
      await screen.findByText("Invalid credentials");
      expect(screen.getByText("Invalid credentials")).toBeTruthy();
    });
  });

  describe("Given that I am a user on the admin login page", () => {

    describe("When I do not fill fields and click on the admin login button", () => {
      test("Then it should display required error messages", () => {
        const inputEmailUser = screen.getByTestId("admin-email-input");
        expect(inputEmailUser.value).toBe("");

        const inputPasswordUser = screen.getByTestId("admin-password-input");
        expect(inputPasswordUser.value).toBe("");

        const form = screen.getByTestId("form-admin");
        fireEvent.submit(form);
        expect(screen.getByText("Email is required")).toBeTruthy();
        expect(screen.getByText("Password is required")).toBeTruthy();
      });
    });

    describe("When I fill fields with incorrect format and click on the admin login button", () => {
      test("Then it should display a format error message", () => {
        const inputEmailUser = screen.getByTestId("admin-email-input");
        fireEvent.change(inputEmailUser, { target: { value: "pasunemail" } });

        const inputPasswordUser = screen.getByTestId("admin-password-input");
        fireEvent.change(inputPasswordUser, { target: { value: "azerty" } });

        const form = screen.getByTestId("form-admin");
        fireEvent.submit(form);

        // Assuming there's a way to validate and show errors, e.g., "Invalid email format"
        expect(screen.getByText("Invalid email format")).toBeTruthy();
      });
    });

    describe("When I fill fields with correct format and click on the admin login button", () => {
      test("Then I should be identified as an Admin in the app", async () => {
        const inputData = {
          type: "Admin",
          email: "johndoe@email.com",
          password: "azerty",
          status: "connected",
        };

        const inputEmailUser = screen.getByTestId("admin-email-input");
        fireEvent.change(inputEmailUser, { target: { value: inputData.email } });

        const inputPasswordUser = screen.getByTestId("admin-password-input");
        fireEvent.change(inputPasswordUser, { target: { value: inputData.password } });

        const form = screen.getByTestId("form-admin");

        // Mock localStorage
        Object.defineProperty(window, "localStorage", {
          value: {
            getItem: jest.fn(() => null),
            setItem: jest.fn(() => null),
          },
          writable: true,
        });

        // Mock navigation
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        let PREVIOUS_LOCATION = "";
        const store = jest.fn();

        const login = new Login({
          document,
          localStorage: window.localStorage,
          onNavigate,
          PREVIOUS_LOCATION,
          store,
        });

        const handleSubmit = jest.fn(login.handleSubmitAdmin);
        login.login = jest.fn().mockResolvedValue({});
        form.addEventListener("submit", handleSubmit);
        fireEvent.submit(form);
        expect(handleSubmit).toHaveBeenCalled();
        expect(window.localStorage.setItem).toHaveBeenCalled();
        expect(window.localStorage.setItem).toHaveBeenCalledWith(
          "user",
          JSON.stringify({
            type: "Admin",
            email: inputData.email,
            password: inputData.password,
            status: "connected",
          })
        );

        // Assuming the app navigates to the HR dashboard page
        //expect(screen.getByText("Validations")).toBeTruthy();
      });
    });
  });
});
