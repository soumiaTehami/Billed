/**
 * @jest-environment jsdom
 */

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

// Configuration du conteneur NewBill
const setupNewBill = (store = null) => {
  return new NewBill({ document, onNavigate, store, localStorage });
};

describe("Employee Connected", () => {
  beforeEach(() => setupTestEnvironment());

  describe("NewBill Page", () => {

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

      formFields.forEach(field => {
        expect(screen.getByTestId(field)).toBeTruthy();
      });

     // expect(screen.getByTestId("form-new-bill")).toBeInTheDocument();
      expect(screen.getByText("Envoyer une note de frais")).toBeInTheDocument();
    });

    describe("Gestion du téléchargement de fichier", () => {
      beforeEach(() => {
        setupTestEnvironment();
        document.body.innerHTML = NewBillUI();
      });

      const testFileUpload = async (fileName, fileType, isValid, alertExpected) => {
        const newBill = setupNewBill();
        const handleChangeFile = jest.fn(newBill.handleChangeFile);
        const fileInput = screen.getByTestId("file");

        window.alert = jest.fn();

        fileInput.addEventListener("change", handleChangeFile);
        fireEvent.change(fileInput, {
          target: { files: [new File(["file"], fileName, { type: fileType })] },
        });

        await waitFor(() => expect(handleChangeFile).toHaveBeenCalled());

        if (isValid) {
          expect(fileInput.files[0].name).toBe(fileName);
          expect(newBill.fileName).toBe(fileName);
          expect(newBill.isImgFormatValid).toBe(true);
          expect(newBill.formData).not.toBeNull();
          expect(window.alert).not.toHaveBeenCalled();
        } else {
          expect(newBill.fileName).toBeNull();
          expect(newBill.isImgFormatValid).toBe(false);
          expect(newBill.formData).toBeUndefined();
          expect(window.alert).toHaveBeenCalledTimes(alertExpected ? 1 : 0);
        }
      };

      test("Téléchargement d'un fichier valide (image)", async () => {
        await testFileUpload("file.png", "image/png", true, false);
      });

      test("Téléchargement d'un fichier non valide (PDF)", async () => {
        await testFileUpload("file.pdf", "application/pdf", false, true);
      });
    });

    test("Soumission du formulaire déclenche handleSubmit", async () => {
      document.body.innerHTML = NewBillUI();
      const newBill = setupNewBill(mockStore);
      newBill.isImgFormatValid = true;

      const formNewBill = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn(newBill.handleSubmit);

      formNewBill.addEventListener("submit", handleSubmit);
      fireEvent.submit(formNewBill);

      await waitFor(() => expect(handleSubmit).toHaveBeenCalled());
    });
  });

  describe("API POST", () => {
    test("Soumission d'une nouvelle note de frais via l'API mockée", async () => {
      const postSpy = jest.spyOn(mockStore, "bills");

      const bill = {
        id: "47qAXb6fIm2zOKkLzMro",
        vat: "80",
        fileUrl: "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
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

      const postBills = await mockStore.bills().update(bill);

      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(postBills).toStrictEqual(bill);
    });

    describe("Gestion des erreurs de l'API", () => {
      beforeEach(() => {
        setupTestEnvironment();
        document.body.innerHTML = NewBillUI();
      });

      const testAPIError = async (errorCode) => {
        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

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

        await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalledWith(new Error(errorCode)));

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
  });
});
