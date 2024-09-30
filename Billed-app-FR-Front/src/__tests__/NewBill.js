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
const configurerEnvironnementTest = (typeUtilisateur = "Employee") => {
  Object.defineProperty(window, "localStorage", { value: localStorageMock });
  window.localStorage.setItem("user", JSON.stringify({ type: typeUtilisateur }));

  const root = document.createElement("div");
  root.setAttribute("id", "root");
  document.body.append(root);
  router();
  window.onNavigate(ROUTES_PATH.NewBill);
};

// Configuration du conteneur NewBill
const configurerNewBill = (store = null) => {
  return new NewBill({ document, onNavigate, store, localStorage });
};

describe("Utilisateur employé connecté", () => {
  beforeEach(() => configurerEnvironnementTest());
});

describe("Page Nouvelle Note de Frais", () => {
  configurerEnvironnementTest();

  test("L'icône de mail est surlignée", async () => {
    const mailIcon = await screen.findByTestId("icon-mail");
    expect(mailIcon).toHaveClass("active-icon");
  });

  test("Le formulaire de nouvelle note de frais est correctement rendu", () => {
    document.body.innerHTML = NewBillUI();

    const champsFormulaire = [
      "expense-type",
      "expense-name",
      "datepicker",
      "amount",
      "vat",
      "pct",
      "commentary",
      "file",
    ];

    champsFormulaire.forEach((champ) => {
      expect(screen.getByTestId(champ)).toBeTruthy();
    });

    expect(screen.getByText("Envoyer une note de frais")).toBeInTheDocument();
  });
});

describe("En tant qu'employé, quand je télécharge un fichier", () => {
  test("Si je télécharge le bon format, le fichier doit être envoyé", () => {
    document.body.innerHTML = NewBillUI();

    const newBillMock = new NewBill({
      document,
      onNavigate,
      store: mockStore,
      localStorage: localStorageMock,
    });

    const handleChangeFileTest = jest.fn((e) =>
      newBillMock.handleChangeFile(e)
    );
    const fichier = screen.getByTestId("file");
    const fichierTest = new File(["test"], "test.png", {
      type: "image/png",
    });
    fichier.addEventListener("change", handleChangeFileTest);

    fireEvent.change(fichier, { target: { files: [fichierTest] } });

    expect(handleChangeFileTest).toHaveBeenCalled();
    expect(fichier.files[0]).toStrictEqual(fichierTest);

    const formulaireNewBill = screen.getByTestId("form-new-bill");

    expect(formulaireNewBill).toBeTruthy();

    const handleSubmitTest = jest.fn((e) => newBillMock.handleSubmit(e));
    formulaireNewBill.addEventListener("submit", handleSubmitTest);

    fireEvent.submit(formulaireNewBill);

    expect(handleSubmitTest).toHaveBeenCalled();
  });
});

describe("API POST", () => {
  configurerEnvironnementTest();
  test("Soumission d'une nouvelle note de frais via l'API mockée", async () => {
    const postSpy = jest.spyOn(mockStore, "bills");

    const noteDeFrais = {
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
  });
});

describe("Gestion des erreurs de l'API", () => {
  beforeEach(() => {
    configurerEnvironnementTest();
    document.body.innerHTML = NewBillUI();
  });

  const testerErreurAPI = async (codeErreur) => {
    const espionConsoleErreur = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const store = {
      bills: jest.fn(() => ({
        update: jest.fn(() => Promise.reject(new Error(codeErreur))),
      })),
    };

    const newBill = configurerNewBill(store);
    newBill.isImgFormatValid = true;

    const formulaire = screen.getByTestId("form-new-bill");
    const handleSubmit = jest.fn(newBill.handleSubmit);

    formulaire.addEventListener("submit", handleSubmit);
    fireEvent.submit(formulaire);

    await waitFor(() =>
      expect(espionConsoleErreur).toHaveBeenCalledWith(new Error(codeErreur))
    );

    espionConsoleErreur.mockRestore();
  };

  test("Erreur 400 lors de l'appel à l'API", async () => {
    await testerErreurAPI("400");
  });

  test("Erreur 404 lors de l'appel à l'API", async () => {
    await testerErreurAPI("404");
  });

  test("Erreur 500 lors de l'appel à l'API", async () => {
    await testerErreurAPI("500");
  });
});
