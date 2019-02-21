let fuse

const {
	FuseBox,
	ConsolidatePlugin,
	WebIndexPlugin,
	StylusPlugin,
	CSSResourcePlugin,
	CSSPlugin,
	JSONPlugin,
	PostCSSPlugin,
	QuantumPlugin,
	VueComponentPlugin
} = require('fuse-box')
const {
	src,
	task,
	context
} = require('fuse-box/sparky')

class Builder {
	constructor () {
		this.isProduction = false
	}

	setProduction () {
		this.isProduction = true
	}

	getFuse () {
		return FuseBox.init({
			homeDir: 'src',
			target: 'browser@es5',
			output: 'dist/$name.js',
			modulesFolder: 'src/shims',
			sourceMaps: !this.isProduction,
			useTypescriptCompiler: true,
			allowSyntheticDefaultImports: true,
			plugins: [
				VueComponentPlugin({
					style: [
						CSSResourcePlugin({
							resolve: (file) => {
								return `/img/${file}`
							},
							macros: { static: `${__dirname}/src/assets/img/`, fonts: `${__dirname}/src/assets/fonts/` },
							dist: `${__dirname}/dist/img/`
						}),
						CSSPlugin()
					]
				}),
				CSSPlugin(),
				JSONPlugin(),
				WebIndexPlugin({
					template: 'src/index.html'
				}),
				this.isProduction && QuantumPlugin({
					bakeApiIntoBundle: 'app',
					uglify: false,
					// css: true,
					treeshake: true,
					ensureES5: true
				})
			]
		})
	}

	createBundle (fuse) {
		const app = fuse.bundle('app').sourceMaps( !this.isProduction )

		if (!this.isProduction) {
			app.hmr()
			app.watch()
		}

		app.instructions('> index.js')

		return app
	}
}

context(Builder)

task('copy-assets', async (context) => {
	await src('./*.*', { base: './src/static/' }).dest('dist/').exec()
	await src('./*.json', { base: './src/lang/' }).dest('dist/').exec()
} )

task('clean', async () => {
	await src('./dist')
		.clean('dist/')
		.exec()
})

task('default', ['clean', 'copy-assets'], async (context) => {
	fuse = context.getFuse()
	fuse.dev({
		open: !!process.env.npm_config_open,
		port: 5555,
		fallback: 'index.html'
	})
	context.createBundle(fuse)
	await fuse.run()
})

task('build', ['clean', 'copy-assets'], async (context) => {
	context.setProduction()
	const fuse = context.getFuse()
	context.createBundle(fuse)
	await fuse.run()
})
