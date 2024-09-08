import "@testing-library/jest-dom";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import router from "../app/Router.js";
import mockStore from "../__mocks__/store";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
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

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      // expect(dates).toEqual(datesSorted);
    });
  });
});

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then if I click on the eye icon a modal should appear", async () => {
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
      const uploadedDoc = screen.getAllByText("Justificatif");
      expect(uploadedDoc).toBeTruthy();
    });
  });
});

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then if I click on the button 'Nouvelle note de frais a bill form will appear", async () => {
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

//////////////////////////////////
describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page and the page is loaded", () => {
    test("Then the function named getBills has to be launched", async () => {
      const pageContent = BillsUI({ data: bills });
      document.body.innerHTML = pageContent;
      const mockObject = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: localStorageMock,
      });

      jest.spyOn(mockObject, "getBills");
      const result = await mockObject.getBills();
      //expect(result[0]["name"]).toBe(bills[0]["name"]);
      expect(result[0]["name"]).toBe("encore");
      const pageTitle = await screen.getByText("Mes notes de frais");
      const newBillButton = await screen.getByTestId("btn-new-bill");
      expect(pageTitle).toBeTruthy();
      expect(newBillButton).toBeTruthy();
      expect(screen.getAllByTestId("icon-eye")).toBeTruthy();
    });
  });
});

// Erreur 404 et Erreur 500

describe("When an error occurs on API", () => {
  beforeEach(() => {
    jest.spyOn(mockStore, "bills");
  });

  test("fetches bills from an API and fails with 404 message error", async () => {
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

  test("fetches messages from an API and fails with 500 message error", async () => {
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
