"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/auth/recuperar/route";
exports.ids = ["app/api/auth/recuperar/route"];
exports.modules = {

/***/ "@prisma/client":
/*!*********************************!*\
  !*** external "@prisma/client" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "child_process":
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "dns":
/*!**********************!*\
  !*** external "dns" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("dns");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("events");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

module.exports = require("fs");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ "net":
/*!**********************!*\
  !*** external "net" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("net");

/***/ }),

/***/ "os":
/*!*********************!*\
  !*** external "os" ***!
  \*********************/
/***/ ((module) => {

module.exports = require("os");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("path");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("stream");

/***/ }),

/***/ "tls":
/*!**********************!*\
  !*** external "tls" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("tls");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("util");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("zlib");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2Frecuperar%2Froute&page=%2Fapi%2Fauth%2Frecuperar%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2Frecuperar%2Froute.js&appDir=C%3A%5CUsers%5CHenrique%5COneDrive%5CImagens%5CPoint%5CPoint%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CHenrique%5COneDrive%5CImagens%5CPoint%5CPoint&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2Frecuperar%2Froute&page=%2Fapi%2Fauth%2Frecuperar%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2Frecuperar%2Froute.js&appDir=C%3A%5CUsers%5CHenrique%5COneDrive%5CImagens%5CPoint%5CPoint%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CHenrique%5COneDrive%5CImagens%5CPoint%5CPoint&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_Users_Henrique_OneDrive_Imagens_Point_Point_src_app_api_auth_recuperar_route_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./src/app/api/auth/recuperar/route.js */ \"(rsc)/./src/app/api/auth/recuperar/route.js\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/auth/recuperar/route\",\n        pathname: \"/api/auth/recuperar\",\n        filename: \"route\",\n        bundlePath: \"app/api/auth/recuperar/route\"\n    },\n    resolvedPagePath: \"C:\\\\Users\\\\Henrique\\\\OneDrive\\\\Imagens\\\\Point\\\\Point\\\\src\\\\app\\\\api\\\\auth\\\\recuperar\\\\route.js\",\n    nextConfigOutput,\n    userland: C_Users_Henrique_OneDrive_Imagens_Point_Point_src_app_api_auth_recuperar_route_js__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/auth/recuperar/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZhdXRoJTJGcmVjdXBlcmFyJTJGcm91dGUmcGFnZT0lMkZhcGklMkZhdXRoJTJGcmVjdXBlcmFyJTJGcm91dGUmYXBwUGF0aHM9JnBhZ2VQYXRoPXByaXZhdGUtbmV4dC1hcHAtZGlyJTJGYXBpJTJGYXV0aCUyRnJlY3VwZXJhciUyRnJvdXRlLmpzJmFwcERpcj1DJTNBJTVDVXNlcnMlNUNIZW5yaXF1ZSU1Q09uZURyaXZlJTVDSW1hZ2VucyU1Q1BvaW50JTVDUG9pbnQlNUNzcmMlNUNhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPUMlM0ElNUNVc2VycyU1Q0hlbnJpcXVlJTVDT25lRHJpdmUlNUNJbWFnZW5zJTVDUG9pbnQlNUNQb2ludCZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD0mcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQXNHO0FBQ3ZDO0FBQ2M7QUFDOEM7QUFDM0g7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLGdIQUFtQjtBQUMzQztBQUNBLGNBQWMseUVBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxpRUFBaUU7QUFDekU7QUFDQTtBQUNBLFdBQVcsNEVBQVc7QUFDdEI7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUN1SDs7QUFFdkgiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9wb2ludC8/NTZiNiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHBSb3V0ZVJvdXRlTW9kdWxlIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvZnV0dXJlL3JvdXRlLW1vZHVsZXMvYXBwLXJvdXRlL21vZHVsZS5jb21waWxlZFwiO1xuaW1wb3J0IHsgUm91dGVLaW5kIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvZnV0dXJlL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCJDOlxcXFxVc2Vyc1xcXFxIZW5yaXF1ZVxcXFxPbmVEcml2ZVxcXFxJbWFnZW5zXFxcXFBvaW50XFxcXFBvaW50XFxcXHNyY1xcXFxhcHBcXFxcYXBpXFxcXGF1dGhcXFxccmVjdXBlcmFyXFxcXHJvdXRlLmpzXCI7XG4vLyBXZSBpbmplY3QgdGhlIG5leHRDb25maWdPdXRwdXQgaGVyZSBzbyB0aGF0IHdlIGNhbiB1c2UgdGhlbSBpbiB0aGUgcm91dGVcbi8vIG1vZHVsZS5cbmNvbnN0IG5leHRDb25maWdPdXRwdXQgPSBcIlwiXG5jb25zdCByb3V0ZU1vZHVsZSA9IG5ldyBBcHBSb3V0ZVJvdXRlTW9kdWxlKHtcbiAgICBkZWZpbml0aW9uOiB7XG4gICAgICAgIGtpbmQ6IFJvdXRlS2luZC5BUFBfUk9VVEUsXG4gICAgICAgIHBhZ2U6IFwiL2FwaS9hdXRoL3JlY3VwZXJhci9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL2F1dGgvcmVjdXBlcmFyXCIsXG4gICAgICAgIGZpbGVuYW1lOiBcInJvdXRlXCIsXG4gICAgICAgIGJ1bmRsZVBhdGg6IFwiYXBwL2FwaS9hdXRoL3JlY3VwZXJhci9yb3V0ZVwiXG4gICAgfSxcbiAgICByZXNvbHZlZFBhZ2VQYXRoOiBcIkM6XFxcXFVzZXJzXFxcXEhlbnJpcXVlXFxcXE9uZURyaXZlXFxcXEltYWdlbnNcXFxcUG9pbnRcXFxcUG9pbnRcXFxcc3JjXFxcXGFwcFxcXFxhcGlcXFxcYXV0aFxcXFxyZWN1cGVyYXJcXFxccm91dGUuanNcIixcbiAgICBuZXh0Q29uZmlnT3V0cHV0LFxuICAgIHVzZXJsYW5kXG59KTtcbi8vIFB1bGwgb3V0IHRoZSBleHBvcnRzIHRoYXQgd2UgbmVlZCB0byBleHBvc2UgZnJvbSB0aGUgbW9kdWxlLiBUaGlzIHNob3VsZFxuLy8gYmUgZWxpbWluYXRlZCB3aGVuIHdlJ3ZlIG1vdmVkIHRoZSBvdGhlciByb3V0ZXMgdG8gdGhlIG5ldyBmb3JtYXQuIFRoZXNlXG4vLyBhcmUgdXNlZCB0byBob29rIGludG8gdGhlIHJvdXRlLlxuY29uc3QgeyByZXF1ZXN0QXN5bmNTdG9yYWdlLCBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcyB9ID0gcm91dGVNb2R1bGU7XG5jb25zdCBvcmlnaW5hbFBhdGhuYW1lID0gXCIvYXBpL2F1dGgvcmVjdXBlcmFyL3JvdXRlXCI7XG5mdW5jdGlvbiBwYXRjaEZldGNoKCkge1xuICAgIHJldHVybiBfcGF0Y2hGZXRjaCh7XG4gICAgICAgIHNlcnZlckhvb2tzLFxuICAgICAgICBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlXG4gICAgfSk7XG59XG5leHBvcnQgeyByb3V0ZU1vZHVsZSwgcmVxdWVzdEFzeW5jU3RvcmFnZSwgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MsIG9yaWdpbmFsUGF0aG5hbWUsIHBhdGNoRmV0Y2gsICB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hcHAtcm91dGUuanMubWFwIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2Frecuperar%2Froute&page=%2Fapi%2Fauth%2Frecuperar%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2Frecuperar%2Froute.js&appDir=C%3A%5CUsers%5CHenrique%5COneDrive%5CImagens%5CPoint%5CPoint%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CHenrique%5COneDrive%5CImagens%5CPoint%5CPoint&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./src/app/api/auth/recuperar/route.js":
/*!*********************************************!*\
  !*** ./src/app/api/auth/recuperar/route.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   POST: () => (/* binding */ POST)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @prisma/client */ \"@prisma/client\");\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_prisma_client__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var nodemailer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! nodemailer */ \"(rsc)/./node_modules/nodemailer/lib/nodemailer.js\");\n\n\n\nconst prisma = new _prisma_client__WEBPACK_IMPORTED_MODULE_1__.PrismaClient();\nasync function POST(request) {\n    const { email } = await request.json();\n    try {\n        console.log(`Solicitação de senha para: ${email}`);\n        // 1. Procura se o funcionário existe no banco\n        const user = await prisma.usuario.findFirst({\n            where: {\n                email: email\n            }\n        });\n        if (!user) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                success: false,\n                message: \"E-mail n\\xe3o encontrado no sistema.\"\n            }, {\n                status: 404\n            });\n        }\n        // 2. Gera o código\n        const codigo = Math.floor(100000 + Math.random() * 900000).toString();\n        // 3. Salva o código no cadastro do funcionário\n        await prisma.usuario.update({\n            where: {\n                id: user.id\n            },\n            data: {\n                codigoRecuperacao: codigo\n            }\n        });\n        // 4. CONFIGURAÇÃO DO CARTEIRO (SEU GMAIL PESSOAL)\n        const transporter = nodemailer__WEBPACK_IMPORTED_MODULE_2__.createTransport({\n            service: \"gmail\",\n            auth: {\n                // Quem ENVIA o e-mail (O Carteiro)\n                user: \"henriquepaiva128@gmail.com\",\n                // A Senha de App gerada neste e-mail (henriquepaiva128@gmail.com)\n                pass: \"vajz ehed czaw ehtd\"\n            }\n        });\n        // 5. O ENVIO\n        await transporter.sendMail({\n            from: '\"Sistema Ponto\" <henriquepaiva128@gmail.com>',\n            to: email,\n            subject: \"Recupera\\xe7\\xe3o de Senha\",\n            html: `\r\n                <div style=\"font-family: sans-serif; padding: 20px; color: #333;\">\r\n                    <h2 style=\"color: #071d41;\">Olá, ${user.nome}!</h2>\r\n                    <p>Você pediu para recuperar sua senha? Aqui está seu código:</p>\r\n                    <div style=\"background: #eef2ff; padding: 20px; font-size: 28px; font-weight: bold; text-align: center; border-radius: 10px; color: #1351b4; letter-spacing: 5px; margin: 20px 0;\">\r\n                        ${codigo}\r\n                    </div>\r\n                    <p style=\"font-size: 12px; color: #666;\">Copie este código e cole no sistema.</p>\r\n                </div>\r\n            `\n        });\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            success: true,\n            message: \"C\\xf3digo enviado com sucesso!\"\n        });\n    } catch (error) {\n        console.error(\"Erro no envio:\", error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            success: false,\n            message: \"Erro ao enviar e-mail.\"\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2FwaS9hdXRoL3JlY3VwZXJhci9yb3V0ZS5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUEyQztBQUNHO0FBQ1Y7QUFFcEMsTUFBTUcsU0FBUyxJQUFJRix3REFBWUE7QUFFeEIsZUFBZUcsS0FBS0MsT0FBTztJQUM5QixNQUFNLEVBQUVDLEtBQUssRUFBRSxHQUFHLE1BQU1ELFFBQVFFLElBQUk7SUFFcEMsSUFBSTtRQUNBQyxRQUFRQyxHQUFHLENBQUMsQ0FBQywyQkFBMkIsRUFBRUgsTUFBTSxDQUFDO1FBRWpELDhDQUE4QztRQUM5QyxNQUFNSSxPQUFPLE1BQU1QLE9BQU9RLE9BQU8sQ0FBQ0MsU0FBUyxDQUFDO1lBQ3hDQyxPQUFPO2dCQUFFUCxPQUFPQTtZQUFNO1FBQzFCO1FBRUEsSUFBSSxDQUFDSSxNQUFNO1lBQ1AsT0FBT1YscURBQVlBLENBQUNPLElBQUksQ0FBQztnQkFBRU8sU0FBUztnQkFBT0MsU0FBUztZQUFvQyxHQUFHO2dCQUFFQyxRQUFRO1lBQUk7UUFDN0c7UUFFQSxtQkFBbUI7UUFDbkIsTUFBTUMsU0FBU0MsS0FBS0MsS0FBSyxDQUFDLFNBQVNELEtBQUtFLE1BQU0sS0FBSyxRQUFRQyxRQUFRO1FBRW5FLCtDQUErQztRQUMvQyxNQUFNbEIsT0FBT1EsT0FBTyxDQUFDVyxNQUFNLENBQUM7WUFDeEJULE9BQU87Z0JBQUVVLElBQUliLEtBQUthLEVBQUU7WUFBQztZQUNyQkMsTUFBTTtnQkFBRUMsbUJBQW1CUjtZQUFPO1FBQ3RDO1FBRUEsa0RBQWtEO1FBQ2xELE1BQU1TLGNBQWN4Qix1REFBMEIsQ0FBQztZQUMzQzBCLFNBQVM7WUFDVEMsTUFBTTtnQkFDRixtQ0FBbUM7Z0JBQ25DbkIsTUFBTTtnQkFFTixrRUFBa0U7Z0JBQ2xFb0IsTUFBTTtZQUNWO1FBQ0o7UUFFQSxhQUFhO1FBQ2IsTUFBTUosWUFBWUssUUFBUSxDQUFDO1lBQ3ZCQyxNQUFNO1lBQ05DLElBQUkzQjtZQUNKNEIsU0FBUztZQUNUQyxNQUFNLENBQUM7O3FEQUVrQyxFQUFFekIsS0FBSzBCLElBQUksQ0FBQzs7O3dCQUd6QyxFQUFFbkIsT0FBTzs7OztZQUlyQixDQUFDO1FBQ0w7UUFFQSxPQUFPakIscURBQVlBLENBQUNPLElBQUksQ0FBQztZQUFFTyxTQUFTO1lBQU1DLFNBQVM7UUFBOEI7SUFFckYsRUFBRSxPQUFPc0IsT0FBTztRQUNaN0IsUUFBUTZCLEtBQUssQ0FBQyxrQkFBa0JBO1FBQ2hDLE9BQU9yQyxxREFBWUEsQ0FBQ08sSUFBSSxDQUFDO1lBQUVPLFNBQVM7WUFBT0MsU0FBUztRQUF5QixHQUFHO1lBQUVDLFFBQVE7UUFBSTtJQUNsRztBQUNKIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vcG9pbnQvLi9zcmMvYXBwL2FwaS9hdXRoL3JlY3VwZXJhci9yb3V0ZS5qcz81MzAzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5leHRSZXNwb25zZSB9IGZyb20gJ25leHQvc2VydmVyJztcclxuaW1wb3J0IHsgUHJpc21hQ2xpZW50IH0gZnJvbSAnQHByaXNtYS9jbGllbnQnO1xyXG5pbXBvcnQgbm9kZW1haWxlciBmcm9tICdub2RlbWFpbGVyJztcclxuXHJcbmNvbnN0IHByaXNtYSA9IG5ldyBQcmlzbWFDbGllbnQoKTtcclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBQT1NUKHJlcXVlc3QpIHtcclxuICAgIGNvbnN0IHsgZW1haWwgfSA9IGF3YWl0IHJlcXVlc3QuanNvbigpO1xyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coYFNvbGljaXRhw6fDo28gZGUgc2VuaGEgcGFyYTogJHtlbWFpbH1gKTtcclxuXHJcbiAgICAgICAgLy8gMS4gUHJvY3VyYSBzZSBvIGZ1bmNpb27DoXJpbyBleGlzdGUgbm8gYmFuY29cclxuICAgICAgICBjb25zdCB1c2VyID0gYXdhaXQgcHJpc21hLnVzdWFyaW8uZmluZEZpcnN0KHtcclxuICAgICAgICAgICAgd2hlcmU6IHsgZW1haWw6IGVtYWlsIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKCF1c2VyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IHN1Y2Nlc3M6IGZhbHNlLCBtZXNzYWdlOiBcIkUtbWFpbCBuw6NvIGVuY29udHJhZG8gbm8gc2lzdGVtYS5cIiB9LCB7IHN0YXR1czogNDA0IH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gMi4gR2VyYSBvIGPDs2RpZ29cclxuICAgICAgICBjb25zdCBjb2RpZ28gPSBNYXRoLmZsb29yKDEwMDAwMCArIE1hdGgucmFuZG9tKCkgKiA5MDAwMDApLnRvU3RyaW5nKCk7XHJcblxyXG4gICAgICAgIC8vIDMuIFNhbHZhIG8gY8OzZGlnbyBubyBjYWRhc3RybyBkbyBmdW5jaW9uw6FyaW9cclxuICAgICAgICBhd2FpdCBwcmlzbWEudXN1YXJpby51cGRhdGUoe1xyXG4gICAgICAgICAgICB3aGVyZTogeyBpZDogdXNlci5pZCB9LFxyXG4gICAgICAgICAgICBkYXRhOiB7IGNvZGlnb1JlY3VwZXJhY2FvOiBjb2RpZ28gfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyA0LiBDT05GSUdVUkHDh8ODTyBETyBDQVJURUlSTyAoU0VVIEdNQUlMIFBFU1NPQUwpXHJcbiAgICAgICAgY29uc3QgdHJhbnNwb3J0ZXIgPSBub2RlbWFpbGVyLmNyZWF0ZVRyYW5zcG9ydCh7XHJcbiAgICAgICAgICAgIHNlcnZpY2U6ICdnbWFpbCcsXHJcbiAgICAgICAgICAgIGF1dGg6IHtcclxuICAgICAgICAgICAgICAgIC8vIFF1ZW0gRU5WSUEgbyBlLW1haWwgKE8gQ2FydGVpcm8pXHJcbiAgICAgICAgICAgICAgICB1c2VyOiAnaGVucmlxdWVwYWl2YTEyOEBnbWFpbC5jb20nLCBcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gQSBTZW5oYSBkZSBBcHAgZ2VyYWRhIG5lc3RlIGUtbWFpbCAoaGVucmlxdWVwYWl2YTEyOEBnbWFpbC5jb20pXHJcbiAgICAgICAgICAgICAgICBwYXNzOiAndmFqeiBlaGVkIGN6YXcgZWh0ZCcgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gNS4gTyBFTlZJT1xyXG4gICAgICAgIGF3YWl0IHRyYW5zcG9ydGVyLnNlbmRNYWlsKHtcclxuICAgICAgICAgICAgZnJvbTogJ1wiU2lzdGVtYSBQb250b1wiIDxoZW5yaXF1ZXBhaXZhMTI4QGdtYWlsLmNvbT4nLCAvLyBRdWVtIG1hbmRhXHJcbiAgICAgICAgICAgIHRvOiBlbWFpbCwgLy8gUXVlbSByZWNlYmUgKG8gZS1tYWlsIGRvIGZ1bmNpb27DoXJpbzogZXNiYW0sIGhvdG1haWwsIGV0YylcclxuICAgICAgICAgICAgc3ViamVjdDogJ1JlY3VwZXJhw6fDo28gZGUgU2VuaGEnLFxyXG4gICAgICAgICAgICBodG1sOiBgXHJcbiAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPVwiZm9udC1mYW1pbHk6IHNhbnMtc2VyaWY7IHBhZGRpbmc6IDIwcHg7IGNvbG9yOiAjMzMzO1wiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxoMiBzdHlsZT1cImNvbG9yOiAjMDcxZDQxO1wiPk9sw6EsICR7dXNlci5ub21lfSE8L2gyPlxyXG4gICAgICAgICAgICAgICAgICAgIDxwPlZvY8OqIHBlZGl1IHBhcmEgcmVjdXBlcmFyIHN1YSBzZW5oYT8gQXF1aSBlc3TDoSBzZXUgY8OzZGlnbzo8L3A+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBzdHlsZT1cImJhY2tncm91bmQ6ICNlZWYyZmY7IHBhZGRpbmc6IDIwcHg7IGZvbnQtc2l6ZTogMjhweDsgZm9udC13ZWlnaHQ6IGJvbGQ7IHRleHQtYWxpZ246IGNlbnRlcjsgYm9yZGVyLXJhZGl1czogMTBweDsgY29sb3I6ICMxMzUxYjQ7IGxldHRlci1zcGFjaW5nOiA1cHg7IG1hcmdpbjogMjBweCAwO1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAke2NvZGlnb31cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8cCBzdHlsZT1cImZvbnQtc2l6ZTogMTJweDsgY29sb3I6ICM2NjY7XCI+Q29waWUgZXN0ZSBjw7NkaWdvIGUgY29sZSBubyBzaXN0ZW1hLjwvcD5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICBgXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6IFwiQ8OzZGlnbyBlbnZpYWRvIGNvbSBzdWNlc3NvIVwiIH0pO1xyXG5cclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm8gbm8gZW52aW86XCIsIGVycm9yKTtcclxuICAgICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBzdWNjZXNzOiBmYWxzZSwgbWVzc2FnZTogXCJFcnJvIGFvIGVudmlhciBlLW1haWwuXCIgfSwgeyBzdGF0dXM6IDUwMCB9KTtcclxuICAgIH1cclxufSJdLCJuYW1lcyI6WyJOZXh0UmVzcG9uc2UiLCJQcmlzbWFDbGllbnQiLCJub2RlbWFpbGVyIiwicHJpc21hIiwiUE9TVCIsInJlcXVlc3QiLCJlbWFpbCIsImpzb24iLCJjb25zb2xlIiwibG9nIiwidXNlciIsInVzdWFyaW8iLCJmaW5kRmlyc3QiLCJ3aGVyZSIsInN1Y2Nlc3MiLCJtZXNzYWdlIiwic3RhdHVzIiwiY29kaWdvIiwiTWF0aCIsImZsb29yIiwicmFuZG9tIiwidG9TdHJpbmciLCJ1cGRhdGUiLCJpZCIsImRhdGEiLCJjb2RpZ29SZWN1cGVyYWNhbyIsInRyYW5zcG9ydGVyIiwiY3JlYXRlVHJhbnNwb3J0Iiwic2VydmljZSIsImF1dGgiLCJwYXNzIiwic2VuZE1haWwiLCJmcm9tIiwidG8iLCJzdWJqZWN0IiwiaHRtbCIsIm5vbWUiLCJlcnJvciJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/auth/recuperar/route.js\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/nodemailer"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fauth%2Frecuperar%2Froute&page=%2Fapi%2Fauth%2Frecuperar%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fauth%2Frecuperar%2Froute.js&appDir=C%3A%5CUsers%5CHenrique%5COneDrive%5CImagens%5CPoint%5CPoint%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CHenrique%5COneDrive%5CImagens%5CPoint%5CPoint&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();