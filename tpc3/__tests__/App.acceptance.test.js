/**
 * Acceptance Test — TPC#3
 * Scenario: Add a new recycling point with name and type,
 *           and verify it appears on the map.
 *
 * Tool: Jest + React Native Testing Library
 * App:  EcoMap (React Native / Expo)
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import App from '../App';

describe('Acceptance Test: Add new recycling point', () => {
    /**
     * Given the user is on the map screen
     * When they press the "+" FAB
     * Then the "Adicionar Local" screen is shown
     */
    it('opens the add-location form when FAB is pressed', () => {
        render(<App />);

        // Map screen should be visible initially
        expect(screen.getByText('♻ EcoMap')).toBeTruthy();

        // Press the FAB (＋)
        fireEvent.press(screen.getByText('＋'));

        // Add screen should now be visible
        expect(screen.getByText('Adicionar Local')).toBeTruthy();
    });

    /**
     * Given the user is on the add-location form
     * When they press submit without filling in the name
     * Then an error message "Nome obrigatório" is shown
     */
    it('shows validation error when name is empty on submit', () => {
        render(<App />);

        // Navigate to add screen
        fireEvent.press(screen.getByText('＋'));

        // Clear the type selection so types error also appears (optional, tests name first)
        // Submit without filling name
        fireEvent.press(screen.getByText('✔ Submeter para revisão'));

        expect(screen.getByText('Nome obrigatório')).toBeTruthy();
    });

    /**
     * Given the user fills in a valid name and keeps the default type (Vidro)
     * When they press submit
     * Then they are returned to the map and the new point name appears in the bottom sheet
     */
    it('successfully adds a new point and shows it on the map', () => {
        render(<App />);

        // Open add form
        fireEvent.press(screen.getByText('＋'));
        expect(screen.getByText('Adicionar Local')).toBeTruthy();

        // Fill in the name field
        const nameInput = screen.getByPlaceholderText('ex: Ecoponto Rua Nova');
        fireEvent.changeText(nameInput, 'Ecoponto Teste da Trindade');

        // Move the pin far from all existing points by pressing the minimap
        // All existing points are near x=0.3-0.73, y=0.35-0.64
        // x=0.05, y=0.05 gives distance > 0.12 to all of them
        const miniMap = screen.getByText('Toca no mapa para ajustar o pin').parent;
        fireEvent(miniMap, 'layout', {
            nativeEvent: { layout: { width: 300, height: 180 } },
        });
        fireEvent.press(miniMap, {
            nativeEvent: { locationX: 15, locationY: 9 }, // x=15/300=0.05, y=9/180=0.05
        });

        // Submit
        fireEvent.press(screen.getByText('✔ Submeter para revisão'));

        // Should return to map screen
        expect(screen.getByText('♻ EcoMap')).toBeTruthy();

        // New point should appear in the bottom sheet
        expect(screen.getByText('♻ Ecoponto Teste da Trindade')).toBeTruthy();
    });

    /**
     * Given a new point is placed very close to an existing one
     * When the user submits
     * Then the duplicate warning dialog is shown
     */
    it('shows duplicate warning when point is placed near an existing one', () => {
        render(<App />);

        // Open add form
        fireEvent.press(screen.getByText('＋'));

        // Fill name
        const nameInput = screen.getByPlaceholderText('ex: Ecoponto Rua Nova');
        fireEvent.changeText(nameInput, 'Ponto Duplicado Teste');

        // Default pin position (x=0.5, y=0.5) is far from existing points,
        // so we simulate the pin being moved near the first existing point (x≈0.52, y≈0.46)
        // by directly pressing submit — the default x=0.5,y=0.5 is close enough (distance ~0.057 < 0.12)
        fireEvent.press(screen.getByText('✔ Submeter para revisão'));

        // Duplicate dialog should appear
        expect(screen.getByText('⚠️ Local já existente?')).toBeTruthy();
    });

    /**
     * Given the duplicate dialog is visible
     * When the user chooses "É diferente, continuar mesmo assim"
     * Then the point is saved with pending status and the map is shown
     */
    it('allows saving a point despite duplicate warning', () => {
        render(<App />);

        fireEvent.press(screen.getByText('＋'));

        const nameInput = screen.getByPlaceholderText('ex: Ecoponto Rua Nova');
        fireEvent.changeText(nameInput, 'Confirmação Duplicado');

        fireEvent.press(screen.getByText('✔ Submeter para revisão'));

        // Duplicate dialog visible
        expect(screen.getByText('⚠️ Local já existente?')).toBeTruthy();

        // Confirm saving anyway
        fireEvent.press(screen.getByText('É diferente, continuar mesmo assim'));

        // Back to map
        expect(screen.getByText('♻ EcoMap')).toBeTruthy();
        expect(screen.getByText('♻ Confirmação Duplicado')).toBeTruthy();
    });

    it('shows location disabled modal when GPS is off', () => {
        render(<App />);
        // Simulate GPS off via the helper button
        fireEvent.press(screen.getByText('Simular GPS desligado'));
        expect(screen.getByText('📍 Localização desativada')).toBeTruthy();
    });

    it('shows address too short error when searching with less than 4 chars', () => {
        render(<App />);
        fireEvent.press(screen.getByText('Simular GPS desligado'));
        fireEvent.changeText(screen.getByPlaceholderText('🔍 Rua, cidade ou código postal...'), 'Ru');
        fireEvent.press(screen.getByText('Pesquisar'));
        expect(screen.getByText('Morada demasiado curta. Insere pelo menos 4 caracteres.')).toBeTruthy();
    });
});