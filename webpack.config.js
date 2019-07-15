const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const webpack = require('webpack');

let appEntry = '';

process.argv.forEach( (val, index) => {
    if (index >= 3 && val.startsWith('--app=')) {
        const app = val.substring(6);
        const appPath = `./${app}/src/index.js`;
        if (fs.existsSync(appPath)) {
            appEntry = appPath;
            console.log(`Running application: ${app}`);
        }
        else {
            const err = new Error(`No application named "${app}" exists. Exiting.`);
            console.error(err.message);
            process.exit();
        }
    }
});

module.exports = {
    entry: {
        app: appEntry
    },
    devtool: 'inline-source-map',
    devServer: {
        contentBase: './dist',
        hot: true
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(['dist']),
        new HtmlWebpackPlugin({
            title: 'threeTone',
            template: './index.html'
        }),
        new webpack.HotModuleReplacementPlugin()
    ],
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist')
    }
};