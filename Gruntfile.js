module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-screeps')
    grunt.loadNpmTasks('grunt-contrib-concat')

    var branch = grunt.option('branch') || 'codeRewrite';

    grunt.initConfig({
        screeps: {
            options: {
                email: 'jimmyl@microsoft.com',
                password: 'YUgioh01)!',
                branch: branch,
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
                // Make sure dependencies go earlier in the list.
                src: [
                    "src/*.js",
                        "src/utils/*.js",
                        "src/Creeps/*.js",
                        "src/Structures/*.js",
                            "src/Structures/StructureRole/*.js",
                ],
                dest: "dist/main.js",
            },
        },
    });

    grunt.registerTask("default", ["concat", "screeps"]);
}