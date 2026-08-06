/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"

describe("Given I am connected as an employee", () => {
	describe("When I am on NewBill Page", () => {
		test("Then if I upload a wrong file (pdf), it should be rejected", () => {
			// Affichage de la page
			document.body.innerHTML = NewBillUI()

			// Ciblage de l'input d'upload
			const fileInput = screen.getByTestId("file")

			// Ajout de la logique js
			new NewBill({
				document,
				onNavigate: () => {},
				store: null,
				localStorage: window.localStorage,
			})

			// Simule l'alerte pour ne pas bloquer le test
			window.alert = jest.fn()

			// Création d'un mauvais fichier
			const wrongFile = new File(["hello"], "document.pdf", {
				type: "application/pdf",
			})

			// Simulation de l'ajout du fichier
			fireEvent.change(fileInput, { target: { files: [wrongFile] } })

			// Vérification : le fichier est rejeté, le champ est vidé
			expect(fileInput.value).toBe("")
		})

		test("Then if I upload a valid file (png), it should save it to the store", () => {
			// Simulation d'un utilisateur connecté
			window.localStorage.setItem(
				"user",
				JSON.stringify({ email: "employee@test.tld" }),
			)

			// Affichage de la page
			document.body.innerHTML = NewBillUI()

			// Création d'un faux store
			const mockCreate = jest
				.fn()
				.mockResolvedValue({ fileUrl: "image.png", key: "1234" })
			const mockStore = {
				bills: () => ({
					create: mockCreate,
				}),
			}

			// Ajout de la logique js
			new NewBill({
				document,
				onNavigate: () => {},
				store: mockStore,
				localStorage: window.localStorage,
			})

			// Ciblage de l'input d'upload
			const fileInput = screen.getByTestId("file")

			// Forcer la valeur textuelle du fichier pour contourner la sécurité JSDOM
			Object.defineProperty(fileInput, "value", {
				value: "C:\\fakepath\\image.png",
			})

			// Création d'un bon fichier
			const validFile = new File(["image"], "image.png", { type: "image/png" })

			// Simulation de l'ajout du fichier
			fireEvent.change(fileInput, { target: { files: [validFile] } })

			// Vérification : la méthode create de l'API a bien été appelée
			expect(mockCreate).toHaveBeenCalled()
		})

		test("Then I submit a valid form, it should call updateBill (POST)", () => {
			// Simulation d'un utilisateur connecté
			window.localStorage.setItem(
				"user",
				JSON.stringify({ email: "employee@test.tld" }),
			)

			// Affichage de la page
			document.body.innerHTML = NewBillUI()

			// Ajout de la logique js
			const newBill = new NewBill({
				document,
				onNavigate: () => {},
				store: null,
				localStorage: window.localStorage,
			})

			// Remplissage des champs du formulaire
			screen.getByTestId("expense-type").value = "Transports"
			screen.getByTestId("expense-name").value = "Vol Paris Londres"
			screen.getByTestId("datepicker").value = "2023-04-15"
			screen.getByTestId("amount").value = "348"
			screen.getByTestId("vat").value = "70"
			screen.getByTestId("pct").value = "20"

			// Surveillance de la fonction updateBill
			const updateBillSpy = jest.spyOn(newBill, "updateBill")

			// Ciblage et simulation de la soumission du formulaire
			const form = screen.getByTestId("form-new-bill")
			fireEvent.submit(form)

			// Vérification : la méthode d'envoi a bien été déclenchée
			expect(updateBillSpy).toHaveBeenCalled()
		})
	})
})
