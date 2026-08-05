/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
jest.mock("../app/store", () => mockStore)

import router from "../app/Router.js"
import userEvent from "@testing-library/user-event"
import Bills from "../containers/Bills.js"

describe("Given I am connected as an employee", () => {
	describe("When I am on Bills Page", () => {
		test("Then bill icon in vertical layout should be highlighted", async () => {
			Object.defineProperty(window, "localStorage", { value: localStorageMock })
			window.localStorage.setItem(
				"user",
				JSON.stringify({
					type: "Employee",
				}),
			)
			const root = document.createElement("div")
			root.setAttribute("id", "root")
			document.body.append(root)
			router()
			window.onNavigate(ROUTES_PATH.Bills)
			await waitFor(() => screen.getByTestId("icon-window"))
			const windowIcon = screen.getByTestId("icon-window")

			expect(windowIcon.classList.contains("active-icon")).toBe(true)
		})
		test("Then bills should be ordered from earliest to latest", () => {
			document.body.innerHTML = BillsUI({ data: bills })
			const dates = screen
				.getAllByText(
					/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i,
				)
				.map((a) => a.innerHTML)
			const antiChrono = (a, b) => (a < b ? 1 : -1)
			const datesSorted = [...dates].sort(antiChrono)
			expect(dates).toEqual(datesSorted)
		})
		test("fetches bills from mock API GET", async () => {
			localStorage.setItem(
				"user",
				JSON.stringify({ type: "Employee", email: "a@a" }),
			)
			const root = document.createElement("div")
			root.setAttribute("id", "root")
			document.body.append(root)
			router()
			window.onNavigate(ROUTES_PATH.Bills)
			await waitFor(() => screen.getByText("Mes notes de frais"))
		})
		describe("When an error occurs on API", () => {
			beforeEach(() => {
				jest.spyOn(mockStore, "bills")
				Object.defineProperty(window, "localStorage", {
					value: localStorageMock,
				})
				window.localStorage.setItem(
					"user",
					JSON.stringify({
						type: "Employee",
						email: "a@a",
					}),
				)
				const root = document.createElement("div")
				root.setAttribute("id", "root")
				document.body.appendChild(root)
				router()
			})
			test("fetches bills from an API and fails with 404 message error", async () => {
				mockStore.bills.mockImplementationOnce(() => {
					return {
						list: () => {
							return Promise.reject(new Error("Erreur 404"))
						},
					}
				})
				window.onNavigate(ROUTES_PATH.Bills)
				await new Promise(process.nextTick)
				const message = await screen.getByText(/Erreur 404/)
				expect(message).toBeTruthy()
			})

			test("fetches messages from an API and fails with 500 message error", async () => {
				mockStore.bills.mockImplementationOnce(() => {
					return {
						list: () => {
							return Promise.reject(new Error("Erreur 500"))
						},
					}
				})

				window.onNavigate(ROUTES_PATH.Bills)
				await new Promise(process.nextTick)
				const message = await screen.getByText(/Erreur 500/)
				expect(message).toBeTruthy()
			})
		})

		test("the modal opens after clicking the eye icon", () => {
			// Générer le visuel HTML de la page avec les données des factures
			document.body.innerHTML = BillsUI({ data: bills })

			// Initialiser le conteneur Bills avec la logique JS pour activer les écouteurs de clics
			new Bills({
				document,
				onNavigate: jest.fn(),
				store: null,
				localStorage: window.localStorage,
			})

			// Cibler toutes les icônes oeil présentes sur la page
			const iconEyes = screen.getAllByTestId("icon-eye")

			// Simuler Bootstrap car pas supporté par Jest
			$.fn.modal = jest.fn()

			// Cliquer sur la première icône oeil
			userEvent.click(iconEyes[0])

			// Vérifier que la modale est bien appelée avec le paramètre "show"
			expect($.fn.modal).toHaveBeenCalledWith("show")
		})
	})
})
