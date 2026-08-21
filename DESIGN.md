---
version: "alpha"
name: Ragnar Material 3
description: Arabic RTL Material 3 dark control center for RagnarBot-V0 by Saga Sama.
colors:
  primary: "#D0BCFF"
  on-primary: "#381E72"
  primary-container: "#4F378B"
  secondary: "#CCC2DC"
  tertiary: "#EFB8C8"
  background: "#101014"
  surface: "#141218"
  surface-container: "#211F26"
  surface-container-high: "#2B2930"
  outline: "#938F99"
  success: "#8DE7B2"
  warning: "#FFD789"
  error: "#F2B8B5"
typography:
  display:
    fontFamily: Cairo
    fontSize: 3.5rem
    fontWeight: 800
    lineHeight: 1.08
  title:
    fontFamily: Cairo
    fontSize: 1.25rem
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: Cairo
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: Cairo
    fontSize: 0.78rem
    fontWeight: 700
    letterSpacing: 0.02em
rounded:
  sm: 12px
  md: 20px
  lg: 28px
spacing:
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
components:
  nav-rail:
    backgroundColor: "{colors.surface-container}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.lg}"
  button-tonal:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: 14px
  card:
    backgroundColor: "{colors.surface-container}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.lg}"
    padding: 24px
---

## Overview

RagnarBot-V0 uses a premium Arabic RTL Material 3 dashboard. It should feel like a serious command center: dark surfaces, tonal containers, clear status signals, and large readable controls.

## Colors

Use Material 3 dark surfaces as the foundation. Purple primary tones are reserved for selected navigation and main actions; green, amber, and red are used only for status.

## Typography

Cairo is the dashboard font for Arabic readability. Use strong display headings, compact labels, and generous body line-height.

## Layout

Use a side Navigation Rail on desktop and stacked mobile navigation. The dashboard is split into overview, settings, groups, commands, security, and logs.

## Elevation & Depth

Use tonal surfaces and subtle borders instead of heavy shadows. Elevation is expressed by brighter surface-container layers.

## Shapes

Use Material 3 rounded shapes: 12px for fields, 20px for cards, and 28px for hero/nav/action containers.

## Components

Cards, tonal buttons, outlined fields, switches, chips, tables, and log panels should all share the same token set.

## Do's and Don'ts

Do keep the interface Arabic-first, detailed, and operational. Do not show GoatBot, GoatBot-Pro, old dashboard credits, cookies, appstate, or session secrets in the UI.
