module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-screeps')
    grunt.loadNpmTasks('grunt-contrib-concat')
    grunt.loadNpmTasks('grunt-stripjscomments')

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
                            "src/Creeps/CreepRole/*.js",
                                "src/Creeps/CreepRole/ColonistRole/*.js",
                        "src/Structures/*.js",
                            "src/Structures/StructureRole/*.js",
                ],
                dest: "dist/main.js",
            },
        },

        comments: {
            your_target: {
                // Target-specific file lists and/or options go here. 
                options: {
                    singleline: true,
                    multiline: true,
                },
                src: [ 'dist/*.js'] // files to remove comments from 
            },
        },
    });

    grunt.registerTask("default", ["concat", "comments", "screeps"]);
    //grunt.registerTask("default", ["concat", "screeps"]);
}