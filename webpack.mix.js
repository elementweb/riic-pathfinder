let mix = require('laravel-mix');

var target_path = 'public';

mix.setPublicPath(target_path);

// Mix scripts
mix.js([
    'js/app.js'
], target_path);

// Mix SASS
mix.sass('sass/app.scss', target_path).options({
    postCss: [
        require('postcss-import')(),
        require('postcss-css-variables')(),
        require('postcss-conditionals')(),
        require('postcss-custom-media')(),
        require('postcss-discard-comments')({ removeAll: true }),
        require('css-mqpacker')(),
        require('autoprefixer')()
    ]
});
