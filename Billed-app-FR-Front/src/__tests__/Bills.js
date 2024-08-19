/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import router from "../app/Router.js";
import mockStore from "../__mocks__/store";

// Mock fetch pour les tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}), // Réponse vide par défaut
  })
);

describe("Étant donné que je suis un visiteur (non connecté)", () => {
  describe("Quand je ne remplis pas le champ e-mail ou le champ mot de passe du login employé", () => {
    test("Alors je reste sur la page Login et je suis invité à remplir le champ manquant", async () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Login);
      await waitFor(() => screen.getByTestId("form-employee"));
      const emailInput = screen.getByTestId("employee-email-input");
      const passwordInput = screen.getByTestId("employee-password-input");
      const loginButton = screen.getByTestId("employee-login-button");

      fireEvent.change(emailInput, { target: { value: "" } });
      fireEvent.change(passwordInput, { target: { value: "" } });
      fireEvent.click(loginButton);

      await waitFor(() => screen.getByText(/Veuillez remplir ce champ/i));

      const form = screen.getByTestId("form-employee");
      expect(form).toBeTruthy();
      const errorMessages = screen.getAllByText(/Veuillez remplir ce champ/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });

    test("Alors je reste sur la page Login et je suis invité à remplir le champ e-mail au bon format", async () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Login);
      await waitFor(() => screen.getByTestId("form-employee"));
      const emailInput = screen.getByTestId("employee-email-input");
      const passwordInput = screen.getByTestId("employee-password-input");
      const loginButton = screen.getByTestId("employee-login-button");

      fireEvent.change(emailInput, { target: { value: "email_incorrect" } });
      fireEvent.change(passwordInput, { target: { value: "password" } });
      fireEvent.click(loginButton);

      await waitFor(() => screen.getByText(/Format de l'adresse e-mail non valide/i));

      const form = screen.getByTestId("form-employee");
      expect(form).toBeTruthy();
      const errorMessage = screen.getByText(/Format de l'adresse e-mail non valide/i);
      expect(errorMessage).toBeTruthy();
    });
  });
});

describe("Étant donné que je suis connecté en tant qu'employé", () => {
  describe("Quand je suis sur la page des Notes de frais", () => {
    test("Alors les notes de frais doivent être triées du plus ancien au plus récent", () => {
      document.body.innerHTML = BillsUI({ data: bills });

      // Extraction des dates et conversion en objets Date
      const dates = screen
        .getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
        .map(a => new Date(a.innerHTML));

      // Tri des dates du plus ancien au plus récent
      const datesSorted = [...dates].sort((a, b) => a - b);

      // Vérification que les dates sont triées correctement
      expect(dates).toEqual(datesSorted);
    });

    test("Alors, si je clique sur l'icône de l'œil d’une note de frais, le justificatif doit s'afficher", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      await waitFor(() => screen.getAllByTestId("icon-eye"));
      const iconEye = screen.getAllByTestId("icon-eye")[0];
      $.fn.modal = jest.fn();
      fireEvent.click(iconEye);

      await waitFor(() => screen.getByText("Justificatif"));
      const uploadedDoc = screen.getByText("Justificatif");
      expect(uploadedDoc).toBeTruthy();
    });

    test("Alors, si je clique sur le bouton 'Nouvelle note de frais', je suis envoyé vers la page 'newbills'", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      await waitFor(() => screen.getByTestId("btn-new-bill"));
      const newBillButton = screen.getByTestId("btn-new-bill");
      fireEvent.click(newBillButton);

      await waitFor(() => screen.getByText("Envoyer une note de frais"));
      const newBillPageTitle = screen.getByText("Envoyer une note de frais");
      expect(newBillPageTitle).toBeTruthy();
    });

    test("Alors, si je ne remplis pas l’ensemble des champs requis du formulaire et je clique sur le bouton envoyé, je reste sur la page new bills et je suis invité à remplir les champs requis", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);

      await waitFor(() => screen.getByTestId("form-new-bill"));
      const form = screen.getByTestId("form-new-bill");

      // Vérifier que le bouton est dans le DOM
      await waitFor(() => screen.getByTestId("btn-submit-bill"));
      const submitButton = screen.getByTestId("btn-submit-bill");

      // On ne remplit pas les champs requis
      fireEvent.click(submitButton);

      // Vérifier que les messages d'erreur sont affichés
      await waitFor(() => screen.getAllByText(/Veuillez remplir ce champ/i));
      expect(form).toBeTruthy();
      const errorMessages = screen.getAllByText(/Veuillez remplir ce champ/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });

    test("Alors, la fonction nommée getBills doit être lancée", async () => {
      const pageContent = BillsUI({ data: bills });
      document.body.innerHTML = pageContent;
      const mockObject = new Bills({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: localStorageMock,
      });
      jest.spyOn(mockObject, "getBills");
      const result = await mockObject.getBills();
      expect(result[0]["name"]).toBe(bills[0]["name"]);

      const pageTitle = await screen.getByText("Mes notes de frais");
      const newBillButton = await screen.getByTestId("btn-new-bill");
      expect(pageTitle).toBeTruthy();
      expect(newBillButton).toBeTruthy();
      expect(screen.getAllByTestId("icon-eye")).toBeTruthy();
    });
  });
});
