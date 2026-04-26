/* 
————————————————————————————————————————————————————————————————
Copyright (c) 2026 AvatarKage. Released under the MIT License

https://avatarka.ge/github
———————————————————————————————————————————————————————————————— 
*/

import React from "react";
import { renderToString } from "react-dom/server";

import { vite } from "../servers/vite.js";

/**
 * Renders a React component to an HTML string using Vite SSR.
 *
 * Loads the component dynamically via Vite's SSR module system and renders it
 * to a static HTML string using renderToString.
 *
 * Props are passed directly into the component, allowing it to respond to
 * route context, request data, and any other server-side state (e.g. URL,
 * headers, params, metadata).
 *
 * @param path - Absolute or Vite-resolvable path to the React component.
 * @param props - Props object passed into the React component (e.g. url, params, headers).
 * @returns HTML string of the rendered React component.
 */
export default async function renderComponent(
    path: string,
    props: Record<string, unknown> = {}
) {
    const { default: Component } = await vite.ssrLoadModule(path);

    return renderToString(
        React.createElement(Component, props)
    );
}