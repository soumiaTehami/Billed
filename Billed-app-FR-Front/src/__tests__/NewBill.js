/**
 * @jest-environment jsdom
 */

import NewBill from "../containers/NewBill.js";

describe("Étant donné que je suis connecté en tant qu'employé", () => {
  describe("Quand je suis sur la page Nouvelle Note de Frais", () => {
    describe("lors du téléchargement d'un fichier avec le bon format", () => {
      test("l'email de l'utilisateur doit être sauvegardé", () => {
        // Fonctionnalités et données simulées
        const mockGetElementById = jest.fn().mockReturnValue({});
        const createMock = jest.fn().mockResolvedValue({ fileUrl: "fileURL", key: "key" });
        const fichierBonFormat = new File(['img'], 'image.png', { type: 'image/png' });

        const documentSimule = {
          querySelector: (sélecteur) => {
            if (sélecteur === 'input[data-testid="file"]') {
              return {
                files: [fichierBonFormat],
                addEventListener: jest.fn(),
              };
            } else {
              return { addEventListener: jest.fn() };
            }
          },
          getElementById: mockGetElementById,
        };

        // Configuration de localStorage
        localStorage.setItem("user", '{"email" : "user@email.com"}');

        // Configuration de l'instance de test
        const storeSimule = {
          bills: () => ({
            create: createMock,
          }),
        };
        const instanceObjet = new NewBill({
          document: documentSimule,
          onNavigate: {},
          store: storeSimule,
          localStorage: {},
        });

        // Déclenchement du téléchargement de fichier
        instanceObjet.handleChangeFile({
          preventDefault: jest.fn(),
          target: { value: "image.png" },
        });

        // Attentes
        const emailAttendu = "user@email.com";
        const formData = createMock.mock.calls[0][0].data;
        console.log('formData', formData);

        expect(formData.get("email")).toEqual(emailAttendu);
      });
    });

    describe('lors de la soumission d\'une nouvelle note de frais', () => {
      test('la méthode update doit être appelée sur le store', () => {
        // Fonctionnalités et données simulées
        const mockGetElementById = jest.fn().mockReturnValue({});
        const createMock = jest.fn();
        const fichierBonFormat = new File(['img'], 'image.png', { type: 'image/png' });
        const mockUpdate = jest.fn().mockResolvedValue({});
        const documentSimule = {
          querySelector: (sélecteur) => {
            if (sélecteur === 'input[data-testid="file"]') {
              return {
                files: [fichierBonFormat],
                addEventListener: jest.fn(),
              };
            } else {
              return { addEventListener: jest.fn() };
            }
          },
          getElementById: mockGetElementById,
        };
        const storeSimule = {
          bills: () => ({
            update: mockUpdate,
          }),
        };

        // Configuration de l'instance de test
        const instanceObjet = new NewBill({
          document: documentSimule,
          onNavigate: jest.fn(),
          store: storeSimule,
          localStorage: {},
        });

        // Déclenchement de la soumission du formulaire
        instanceObjet.handleSubmit({
          preventDefault: jest.fn(),
          target: {
            querySelector: (sélecteur) => {
              switch (sélecteur) {
                case 'select[data-testid="expense-type"]':
                  return { value: 'type' };
                case 'input[data-testid="expense-name"]':
                  return { value: 'name' };
                case 'input[data-testid="amount"]':
                  return { value: '3000' };
                case 'input[data-testid="datepicker"]':
                  return { value: 'date' };
                case 'input[data-testid="vat"]':
                  return { value: 'vat' };
                case 'input[data-testid="pct"]':
                  return { value: '25' };
                case 'textarea[data-testid="commentary"]':
                  return { value: 'commentaire' };
              }
            },
          },
        });

        // Attentes
        const donnéesÀVérifier = {
          email: 'user@email.com',
          type: 'type',
          name: 'name',
          amount: 3000,
          date: 'date',
          vat: 'vat',
          pct: 25,
          commentary: 'commentaire',
          fileUrl: null,
          fileName: null,
          status: 'pending',
        };

        // Analyse des données passées à la fonction
        const données = JSON.parse(mockUpdate.mock.calls[0][0].data);
        console.log('données?', données);

        expect(données).toMatchObject(donnéesÀVérifier);
      });
    });
  });
});
