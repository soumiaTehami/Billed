/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { screen, fireEvent, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";

import mockStore from "../__mocks__/store";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import { ROUTES_PATH } from "../constants/routes";

// Configuration de l'environnement de test
const setupTestEnvironment = (userType = "Employee") => {
  Object.defineProperty(window, "localStorage", { value: localStorageMock });
  window.localStorage.setItem("user", JSON.stringify({ type: userType }));

  const root = document.createElement("div");
  root.setAttribute("id", "root");
  document.body.append(root);
  router();
  window.onNavigate(ROUTES_PATH.NewBill);
};

// Configuration du conteneur NewBill`
const setupNewBill = (store = null) => {
  return new NewBill({ document, onNavigate, store, localStorage });
};

describe("Employee Connected", () => {
  beforeEach(() => setupTestEnvironment());
});
describe("NewBill Page", async () => {
  setupTestEnvironment();
  test("L'icône de mail est surlignée", async () => {
    const mailIcon = await screen.findByTestId("icon-mail");
    expect(mailIcon).toHaveClass("active-icon");
  });

  test("Le formulaire de nouvelle note de frais est correctement rendu", () => {
    document.body.innerHTML = NewBillUI();

    const formFields = [
      "expense-type",
      "expense-name",
      "datepicker",
      "amount",
      "vat",
      "pct",
      "commentary",
      "file",
    ];

    formFields.forEach((field) => {
      expect(screen.getByTestId(field)).toBeTruthy();
    });

    //expect(screen.getByTestId("form-new-bill")).toBeInTheDocument();
    expect(screen.getByText("Envoyer une note de frais")).toBeInTheDocument();
  });
});
describe("Given I am connected as an employee, When I upload a file", () => {
  test("Then i upload the right format, the file should be send", () => {
    // Créer une instance de NewBillUI et générer le code HTML pour l'interface utilisateur
    const pageContent = NewBillUI();
    // Remplacer le contenu de l'élément <body> par le code HTML généré
    document.body.innerHTML = pageContent;

    // Créer une nouvelle instance de NewBill avec des dépendances mock injectées
    const newBillMock = new NewBill({
      document,
      onNavigate,
      store: mockStore,
      localStorage: localStorageMock,
    });

    // Mettre en place un écouteur pour l'événement "change" sur l'élément <input type="file">
    const handleChangeFileTest = jest.fn((e) =>
      newBillMock.handleChangeFile(e)
    );
    const files = screen.getByTestId("file");
    const testFormat = new File(["it's a test"], "test.png", {
      type: "image/png",
    });
    files.addEventListener("change", handleChangeFileTest);
    // Simuler une sélection de fichier
    fireEvent.change(files, { target: { files: [testFormat] } });

    // Vérifier que le fichier a été correctement attaché à l'élément <input> et que la fonction handleChangeFile a été appelée
    expect(handleChangeFileTest).toHaveBeenCalled();
    expect(files.files[0]).toStrictEqual(testFormat);

    const formNewBill = screen.getByTestId("form-new-bill");

    // Vérifier que le formulaire existe
    expect(formNewBill).toBeTruthy();

    // Mettre en place un écouteur pour l'événement "submit" sur le formulaire
    const handleSubmitTest = jest.fn((e) => newBillMock.handleSubmit(e));
    formNewBill.addEventListener("submit", handleSubmitTest);

    // On simule une soumission de formulaire
    fireEvent.submit(formNewBill);

    // On verifie que la fonction handleSubmit a été appelée et que le texte attendu est affiché sur la page
    expect(handleSubmitTest).toHaveBeenCalled();
    // expect(screen.getByText("Mes notes de frais")).toBeTruthy();
  });
});

describe("API POST", () => {
  setupTestEnvironment();
  test("Soumission d'une nouvelle note de frais via l'API mockée", async () => {
    const postSpy = jest.spyOn(mockStore, "bills");

    const bill = {
      id: "47qAXb6fIm2zOKkLzMro",
      vat: "80",
      fileUrl:
        "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
      status: "pending",
      type: "Hôtel et logement",
      commentary: "séminaire billed",
      name: "encore",
      fileName: "preview-facture-free-201801-pdf-1.jpg",
      date: "2004-04-04",
      amount: 400,
      commentAdmin: "ok",
      email: "a@a",
      pct: 20,
    };

    //expect(postSpy).toHaveBeenCalledTimes(1);
  });
});
describe("Gestion des erreurs de l'API", () => {
  beforeEach(() => {
    setupTestEnvironment();

    document.body.innerHTML = NewBillUI();
  });

  const testAPIError = async (errorCode) => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const store = {
      bills: jest.fn(() => ({
        update: jest.fn(() => Promise.reject(new Error(errorCode))),
      })),
    };

    const newBill = setupNewBill(store);
    newBill.isImgFormatValid = true;

    const form = screen.getByTestId("form-new-bill");
    const handleSubmit = jest.fn(newBill.handleSubmit);

    form.addEventListener("submit", handleSubmit);
    fireEvent.submit(form);

    await waitFor(() =>
      expect(consoleErrorSpy).toHaveBeenCalledWith(new Error(errorCode))
    );

    consoleErrorSpy.mockRestore();
  };

  test("Erreur 400 lors de l'appel à l'API", async () => {
    await testAPIError("400");
  });

  test("Erreur 404 lors de l'appel à l'API", async () => {
    await testAPIError("404");
  });

  test("Erreur 500 lors de l'appel à l'API", async () => {
    await testAPIError("500");
  });
});
