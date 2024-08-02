/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import mockStore from "../__mocks__/store";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";

describe("Étant donné que je suis connecté en tant qu'employé", () => {
  // Test pour vérifier que l'icône de mail est activée
  describe("Lorsque je suis sur la page NewBill, il y a une icône de mail dans la disposition verticale", () => {
    test("Alors, l'icône devrait être surlignée", async () => {
      // Simuler le stockage local
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
      
      // Configurer le DOM et router
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);
      
      // Attendre que l'icône de mail soit chargée
      await waitFor(() => screen.getByTestId("icon-mail"));
      const windowIcon = screen.getByTestId("icon-mail");
      
      // Vérifier que l'icône est activée
      expect(windowIcon.classList.contains("active-icon")).toBeTruthy();
    });
  });

  // Test pour vérifier le rendu correct du formulaire
  describe("Lorsque je suis sur la page NewBill, il y a un formulaire", () => {
    test("Alors, tous les champs du formulaire devraient être correctement rendus", () => {
      document.body.innerHTML = NewBillUI();
      
      // Vérifier la présence du formulaire et de ses éléments
      const formNewBill = screen.getByTestId("form-new-bill");
      const type = screen.getAllByTestId("expense-type");
      const name = screen.getAllByTestId("expense-name");
      const date = screen.getAllByTestId("datepicker");
      const amount = screen.getAllByTestId("amount");
      const vat = screen.getAllByTestId("vat");
      const pct = screen.getAllByTestId("pct");
      const commentary = screen.getAllByTestId("commentary");
      const file = screen.getAllByTestId("file");
      const submitBtn = screen.getByTestId("btn-send-bill");

      expect(formNewBill).toBeTruthy();
      expect(type).toHaveLength(1); // Vérifier un seul élément
      expect(name).toHaveLength(1); // Vérifier un seul élément
      expect(date).toHaveLength(1); // Vérifier un seul élément
      expect(amount).toHaveLength(1); // Vérifier un seul élément
      expect(vat).toHaveLength(1); // Vérifier un seul élément
      expect(pct).toHaveLength(1); // Vérifier un seul élément
      expect(commentary).toHaveLength(1); // Vérifier un seul élément
      expect(file).toHaveLength(1); // Vérifier un seul élément
      expect(submitBtn).toBeTruthy();
      
      expect(screen.getByText("Envoyer une note de frais")).toBeInTheDocument();
    });
  });

  // Test pour vérifier le téléchargement d'un fichier au format accepté
  describe("Lorsque je suis sur la page NewBill, et qu'un utilisateur télécharge un fichier au format accepté", () => {
    test("Alors, le nom du fichier devrait être correctement affiché et isImgFormatValid devrait être vrai", () => {
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
      document.body.innerHTML = NewBillUI();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const store = null;

      const newBill = new NewBill({ document, onNavigate, store, localStorage });
      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      const file = screen.getByTestId("file");

      window.alert = jest.fn();

      file.addEventListener("change", handleChangeFile);
      fireEvent.change(file, {
        target: {
          files: [new File(["file.png"], "file.png", { type: "image/png" })],
        },
      });

      expect(handleChangeFile).toHaveBeenCalled();
      expect(file.files[0].name).toBe("file.png");
      expect(newBill.fileName).toBe("file.png");
      expect(newBill.isImgFormatValid).toBe(true);
      expect(newBill.formData).not.toBe(null);
      expect(window.alert).not.toHaveBeenCalled();
    });
  });

  // Test pour vérifier le téléchargement d'un fichier au format non accepté
  describe("Lorsque je suis sur la page NewBill, et qu'un utilisateur télécharge un fichier au format non accepté", () => {
    test("Alors, le nom du fichier ne devrait pas être affiché, isImgFormatValid devrait être faux, et une alerte devrait être affichée", () => {
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
      document.body.innerHTML = NewBillUI();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const store = null;

      const newBill = new NewBill({ document, onNavigate, store, localStorage });
      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      const file = screen.getByTestId("file");

      window.alert = jest.fn();

      file.addEventListener("change", handleChangeFile);
      fireEvent.change(file, {
        target: {
          files: [new File(["file.pdf"], "file.pdf", { type: "file/pdf" })],
        },
      });

      expect(handleChangeFile).toHaveBeenCalled();
      expect(file.files[0].name).toBe("file.pdf");
      expect(newBill.fileName).toBe(null);
      expect(newBill.isImgFormatValid).toBe(false);
      expect(newBill.formData).toBeUndefined();
      expect(window.alert).toHaveBeenCalled();
    });
  });

  // Test pour vérifier la soumission du formulaire
  describe("Lorsque je suis sur la page NewBill, et que l'utilisateur clique sur le bouton de soumission", () => {
    test("Alors, la fonction handleSubmit devrait être appelée", () => {
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
      document.body.innerHTML = NewBillUI();

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const store = {
        bills: jest.fn(() => newBill.store),
        create: jest.fn(() => Promise.resolve({})),
      };

      const newBill = new NewBill({ document, onNavigate, store, localStorage });

      newBill.isImgFormatValid = true;

      const formNewBill = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn(newBill.handleSubmit);
      formNewBill.addEventListener("submit", handleSubmit);
      fireEvent.submit(formNewBill);

      expect(handleSubmit).toHaveBeenCalled();
    });
  });
});

// Test pour l'API POST
describe("Lorsque je navigue vers le tableau de bord employé", () => {
  describe("Étant donné que je suis un utilisateur connecté en tant qu'employé, et qu'un utilisateur poste une nouvelle note de frais", () => {
    test("Ajouter une note de frais via l'API mock POST", async () => {
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
        email:  "a@a",
        pct: 20,
      };

      const postBills = await mockStore.bills().update(bill);
      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(postBills).toStrictEqual(bill);
    });

    // Test pour l'erreur 404 de l'API
    describe("Lorsque une erreur se produit sur l'API", () => {
      beforeEach(() => {
        window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
        document.body.innerHTML = NewBillUI();

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
      });

      test("Ajouter une note de frais via l'API échoue avec une erreur de message 404", async () => {
        const postSpy = jest.spyOn(console, "error");

        const store = {
          bills: jest.fn(() => newBill.store),
          create: jest.fn(() => Promise.resolve({})),
          update: jest.fn(() => Promise.reject(new Error("404"))),
        };

        const newBill = new NewBill({ document, onNavigate, store, localStorage });
        newBill.isImgFormatValid = true;

        // Soumettre le formulaire
        const form = screen.getByTestId("form-new-bill");
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
        form.addEventListener("submit", handleSubmit);

        fireEvent.submit(form);
        await new Promise(process.nextTick);
        expect(postSpy).toBeCalledWith(new Error("404"));
      });

      test("Ajouter une note de frais via l'API échoue avec une erreur de message 500", async () => {
        const postSpy = jest.spyOn(console, "error");

        const store = {
          bills: jest.fn(() => newBill.store),
          create: jest.fn(() => Promise.resolve({})),
          update: jest.fn(() => Promise.reject(new Error("500"))),
        };

        const newBill = new NewBill({ document, onNavigate, store, localStorage });
        newBill.isImgFormatValid = true;

        // Soumettre le formulaire
        const form = screen.getByTestId("form-new-bill");
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
        form.addEventListener("submit", handleSubmit);

        fireEvent.submit(form);
        await new Promise(process.nextTick);
        expect(postSpy).toBeCalledWith(new Error("500"));
      });
    });
  });
});
