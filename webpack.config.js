const path = require('path');

const env = process.env.NODE_ENV;
const isDevelopment = env === 'development';

const analyzer = process.env.ANALYZER;
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const webpackConfig = {
    entry: {
        index: './index.ts'
    },
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: '[name].min.js',
        library: 'z-sandbox',
        libraryTarget: 'umd'
    },
    mode: env,
    devtool: isDevelopment ? 'inline-source-map' : 'source-map',
    plugins: [...(analyzer ? [new BundleAnalyzerPlugin()] : [])],
    resolve: {
        extensions: ['.ts', '.js', '.json'],
        modules: [path.resolve(__dirname, '.'), 'node_modules']
    },
    module: {
        rules: [
            {
                test: /\.(ts|js)$/,
                use: 'babel-loader',
                exclude: /node_modules/
            }
        ]
    },
    devServer: {
        disableHostCheck: true,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
        }
    }
};

module.exports = webpackConfig;
