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

    // Apply shadow settings to CSS variables
    const shadowX = Math.cos((colorSettings.shadowAngle * Math.PI) / 180) * (colorSettings.shadowBlur / 2);
    const shadowY = Math.sin((colorSettings.shadowAngle * Math.PI) / 180) * (colorSettings.shadowBlur / 2);

    // Set shadow CSS variables for use in glass-effect.css
    root.style.setProperty('--shadow-x', `${shadowX}px`);
    root.style.setProperty('--shadow-y', `${shadowY}px`);
    root.style.setProperty('--shadow-blur', `${colorSettings.shadowBlur}px`);
    root.style.setProperty('--shadow-opacity', `${colorSettings.shadowOpacity}`);

    // Note: All glass-based elements now use glass color (--c-glass) exclusively.
    // Primary color is only used for selected items via --c-active.
    // No primary color gradients are applied to buttons or navigation elements.

  }, [colorSettings]);
};
