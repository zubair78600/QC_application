import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';

export const useColorTheme = () => {
  const { colorSettings } = useAppStore();

  useEffect(() => {
    // Apply color settings to CSS variables
    const root = document.documentElement;

    root.style.setProperty('--c-glass', colorSettings.glassColor);
    root.style.setProperty('--c-bg', colorSettings.backgroundColor);
    root.style.setProperty('--c-active', colorSettings.activeColor);
    root.style.setProperty('--card-radius', `${colorSettings.cardRadius}px`);

    // Update body background
    document.body.style.background = colorSettings.backgroundColor;

    // Apply shadow settings to panels
    const shadowX = Math.cos((colorSettings.shadowAngle * Math.PI) / 180) * (colorSettings.shadowBlur / 2);
    const shadowY = Math.sin((colorSettings.shadowAngle * Math.PI) / 180) * (colorSettings.shadowBlur / 2);
    const shadowValue = `${shadowX}px ${shadowY}px ${colorSettings.shadowBlur}px rgba(0, 0, 0, ${colorSettings.shadowOpacity})`;

    // Apply to simple-panel elements
    const panelElements = document.querySelectorAll('.simple-panel');
    panelElements.forEach((element) => {
      if (element instanceof HTMLElement) {
        element.style.boxShadow = shadowValue;
      }
    });

    // Note: All glass-based elements now use glass color (--c-glass) exclusively.
    // Primary color is only used for selected items via --c-active.
    // No primary color gradients are applied to buttons or navigation elements.

  }, [colorSettings]);
};
