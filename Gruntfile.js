module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-screeps')
    grunt.loadNpmTasks('grunt-contrib-concat')

    grunt.initConfig({
        screeps: {
            options: {
                email: 'jimmyl@microsoft.com',
                password: 'YUgioh01)!',
                branch: 'codeRewrite',
                ptr: false
            },
            dist: {
                src: ['dist/*.js']
            }
        },

        concat: {
            dist: {
                options: {
                    separator: "\n\n//---------------------------------------- NEW FILE --------------------------------------------\n",
                },
                src: ["src/*.js"],
                dest: "dist/main.js",
            },
        },
    });

    grunt.registerTask("default", ["concat", "screeps"]);
}