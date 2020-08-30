<?php
namespace Deployer;
require 'recipe/common.php';

// Project name
set('application', 'w-note');

// Project repository
set('repository', 'git@github.com:ngocp-0847/wnote.git');

// [Optional] Allocate tty for git clone. Default value is false.
set('git_tty', true);

// Shared files/dirs between deploys
add('shared_files', ['.env']);
add('shared_dirs', [
    'public/upload',
]);

set('writable_use_sudo', true);
set('allow_anonymous_stats', false);
set('cleanup_use_sudo', true);

set('branch', 'master');

// Hosts
host('52.15.199.9')
    ->stage('production')
    ->roles('app')
    ->user('ec2-user')
    ->set('deploy_path', '/var/www/html/{{application}}');

task('npm:install', function () {
    run('cd {{release_path}} && yarn');
});

task('npm:run:build', function () {
    run('cd {{current_path}} && yarn build');
});

task('pm2:init', function () {
    run('cd {{current_path}} && pm2 start yarn --interpreter bash --name nextjs -- start');
});

task('pm2:restart', function () {
    run('cd {{current_path}} && pm2 restart nextjs && sudo service nginx restart');
});

desc('Deploy your project');
task('deploy', [
    'deploy:info',
    'deploy:prepare',
    'deploy:lock',
    'deploy:release',
    'deploy:update_code',
    'deploy:shared',
    'npm:install',
    'deploy:writable',
    'deploy:symlink',
    'deploy:unlock',
    'npm:run:build',
    'pm2:restart',
    'cleanup',
]);

desc('Deployed successfully!');
