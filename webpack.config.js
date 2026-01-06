const path = require('path');
const nodeExternals = require('webpack-node-externals');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const { NODE_ENV = 'production' } = process.env;
module.exports = {
    entry: './src/server.ts',
    watch: NODE_ENV === 'development',
    mode: NODE_ENV,
    target: 'node',
    externals: [nodeExternals()],
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'server.js',
    },
    resolve: {
        extensions: ['.ts', '.js'],
        plugins: [
            new TsconfigPathsPlugin({
                configFile: './tsconfig.json',
            }),
        ],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: false,
                            compilerOptions: {
                                removeComments: false,
                            },
                        },
                    },
                ],
                exclude: /node_modules/,
            },
        ],
    },
    context: path.resolve(__dirname),
    // plugins: [
    //     new CopyWebpackPlugin({
    //         patterns: [
    //             {
    //                 from: 'src/modules',
    //                 to: 'modules',
    //                 transform: (content, absolutePath) => {
    //                     if (absolutePath.endsWith('.ts')) {
    //                         return content.toString().replace(/\.ts$/, '.js');
    //                     }
    //                     return content;
    //                 },
    //             },
    //         ],
    //     }),
    // ],
};
