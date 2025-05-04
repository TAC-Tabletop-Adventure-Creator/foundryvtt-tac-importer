const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');
const TerserPlugin = require("terser-webpack-plugin");
const CircularDependencyPlugin = require('circular-dependency-plugin');
const MangleCssClassPlugin = require('mangle-css-class-webpack-plugin');
const fs = require('fs');

/**
 * Generates all the entry points needed.
 * @returns {{index: string, "styles/calendar": string}}
 */
function getEntries() {
    //Default required entry points
    const list = {
        "index": {import: './src/index.ts'}
    };
    return list;
}

module.exports = {
    mode: "production",
    entry: getEntries(),
    optimization: {
        removeEmptyChunks: true,
        minimize: true,
        minimizer: [new TerserPlugin({
            extractComments: false, // To avoid separate file with licenses.
            terserOptions: {
                ecma: '2020',
                mangle: true,
                sourceMap: false,
                module: true,
                keep_classnames: /^(NoteSheet|MainApp)$/,
                keep_fnames: false,
                toplevel: true,
            },
        })]
    },
    plugins: [
        new CircularDependencyPlugin({
            exclude: /__mocks__|docs|dist|node_modules|\.test\.ts/,
            include: /src/,
            failOnError: true,
        }),
        new CopyPlugin({
            patterns: [
                { context: './src/', from : '**/*.json', to : './' },
                { context: './src/', from : '**/*.hbs', to : '[path][name].hbs' },
                { context: './', from : 'README.md', to : './' },
                { context: './', from : 'LICENSE', to : './' },
                // Images aren't needed in the build as we're using external URLs
                // { context: './src/assets', from: '**/*.{png,jpg,jpeg,gif,svg,webp}', to: './'}
            ]
        }),
        new MangleCssClassPlugin({
            classNameRegExp: 'fsc-[a-z\-][a-zA-Z0-9_\-]*',
            reserveClassName: ['fa', 'fas', 'far'],
            ignorePrefix: ['fsc-']
        }),
        new RemoveEmptyScriptsPlugin(),
        new MiniCssExtractPlugin({
            filename: "[name].css"
        })
    ],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    // Translates CSS into CommonJS
                    {
                        loader: 'css-loader',
                        options: {
                            url: { filter: (url, resourcePath) => {return !(url.indexOf('/ui/') > -1);}}
                        }
                    },
                    // Compiles Sass to CSS
                    'sass-loader'
                ],
            },
            {
                test: /\.svg$/,
                type: 'asset/source'
            },
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    performance: {
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        clean: true
    },
};