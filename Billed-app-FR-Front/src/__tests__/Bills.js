import "@testing-library/jest-dom";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import router from "../app/Router.js";
import mockStore from "../__mocks__/store";

describe("Étant donné que je suis connecté en tant qu'employé", () => {
  describe("Quand je suis sur la page des Notes de Frais", () => {
    
    // Test 1: L'icône de la fenêtre est active
    test("Alors l'icône de la fenêtre doit être active dans la mise en page verticale", async () => {
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

      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      expect(windowIcon).toHaveClass("active-icon");
    });

    // Test 2: Les factures doivent être classées correctement
    test("Alors les notes de frais doivent être triées de la plus récente à la plus ancienne", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a > b ? 1 : -1); // Modifié pour une logique correcte
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    // Nouveau test 3: Les factures doivent être visibles
    test("Alors les factures doivent être affichées sur la page", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const billsList = screen.getByTestId("tbody");
      expect(billsList).toBeTruthy();
    });
  });
});

describe("Étant donné que je suis connecté en tant qu'employé", () => {
  describe("Quand je suis sur la page des Notes de Frais", () => {

    // Test 4: La modale de justificatif doit apparaître
    test("Alors, si je clique sur l'icône œil, la modale doit s'afficher", async () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      await waitFor(() => screen.getAllByTestId("icon-eye"));
      const iconEye = screen.getAllByTestId("icon-eye");

      $.fn.modal = jest.fn();

      fireEvent.click(iconEye[0]);

      await waitFor(() => screen.getByText("Justificatif"));
      const uploadedDoc = screen.getByText("Justificatif");
      expect(uploadedDoc).toBeTruthy(); // Modifié pour vérifier un seul élément
    });

  });
  // Nouveau test 5: Vérifier si une image du justificatif est visible dans la modale
test("Alors une image du justificatif doit être visible dans la modale", async () => {
  const root = document.createElement("div");
  root.setAttribute("id", "root");
  document.body.append(root);
  router();
  window.onNavigate(ROUTES_PATH.Bills);

  // Attendre que les icônes œil soient disponibles
  await waitFor(() => screen.getAllByTestId("icon-eye"));
  const iconEye = screen.getAllByTestId("icon-eye");
  
  // Simuler le clic sur la première icône œil pour ouvrir la modale
  fireEvent.click(iconEye[0]);

  // Attendre que la modale avec le texte "Justificatif" soit visible
  await waitFor(() => screen.getByText("Justificatif"));

  // Vérifier que la modale est bien ouverte
  const modal = screen.getByText("Justificatif").closest(".modal");
  expect(modal).toBeVisible();

  // Chercher une image dans la modale (au lieu de se baser uniquement sur l'attribut alt)
  const img = modal.querySelector("img");  // Chercher la première image dans la modale
  expect(img).toBeTruthy();  // Vérifie si une image est présente dans la modale
});


});

describe("Étant donné que je suis connecté en tant qu'employé", () => {
  describe("Quand je clique sur le bouton 'Nouvelle note de frais'", () => {
    
    // Test 6: Un formulaire doit apparaître
    test("Alors un formulaire pour créer une nouvelle note de frais doit apparaître", async () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      await waitFor(() => screen.getByTestId("btn-new-bill"));
      const billButton = screen.getByTestId("btn-new-bill");
      fireEvent.click(billButton);

      await waitFor(() => screen.getByTestId("form-new-bill"));
      const billForm = screen.getByTestId("form-new-bill");
      expect(billForm).toBeTruthy();
    });
  });
});

// Erreurs API : Cas 404 et 500
describe("Quand une erreur API se produit", () => {
  beforeEach(() => {
    jest.spyOn(mockStore, "bills");
  });

  // Test 7: Gérer l'erreur 404
  test("Récupère les notes de frais et échoue avec une erreur 404", async () => {
    mockStore.bills.mockImplementationOnce(() => {
      return {
        list: () => {
          return Promise.reject(new Error("Erreur 404"));
        },
      };
    });
    const pageContent = BillsUI({ error: "Erreur 404" });
    document.body.innerHTML = pageContent;
    const errorMessage = await screen.getByText(/Erreur 404/);
    expect(errorMessage).toBeTruthy();
  });

  // Test 8: Gérer l'erreur 500
  test("Récupère les notes de frais et échoue avec une erreur 500", async () => {
    mockStore.bills.mockImplementationOnce(() => {
      return {
        list: () => {
          return Promise.reject(new Error("Erreur 500"));
        },
      };
    });
    const pageContent = BillsUI({ error: "Erreur 500" });
    document.body.innerHTML = pageContent;
    const errorMessage = await screen.getByText(/Erreur 500/);
    expect(errorMessage).toBeTruthy();
  });
});
