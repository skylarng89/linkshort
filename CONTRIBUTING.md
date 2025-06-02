# Contributing to LinkShort

First off, thank you for considering contributing to LinkShort! Your help is appreciated.

## Code of Conduct
This project and everyone participating in it is governed by a [Code of Conduct](CODE_OF_CONDUCT.md) (TODO: Create CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?
- Reporting Bugs
- Suggesting Enhancements
- Writing Code
- Improving Documentation

## Getting Started
1. Fork the repository.
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/linkshort.git`
3. Create a new branch for your feature or bug fix: `git checkout -b feature/your-feature-name` or `git checkout -b fix/your-bug-fix`.
4. Make your changes.
5. Commit your changes using our commit message conventions (see below).
6. Push your branch to your fork: `git push origin feature/your-feature-name`.
7. Open a pull request to the `dev` branch of the main LinkShort repository.

## Commit Message Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/) specification. This is important because commit messages are used to automatically generate changelogs and determine new version numbers.

The commit message should be structured as follows:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Allowed `<type>` values:**
- `feat`: A new feature (corresponds to a MINOR version bump).
- `fix`: A bug fix (corresponds to a PATCH version bump).
- `docs`: Documentation only changes.
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc).
- `refactor`: A code change that neither fixes a bug nor adds a feature.
- `perf`: A code change that improves performance.
- `test`: Adding missing tests or correcting existing tests.
- `build`: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm).
- `ci`: Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs).
- `chore`: Other changes that don't modify `src` or `test` files.
- `revert`: Reverts a previous commit.

**Scope:**
The scope provides additional contextual information and is contained within parenthesis, e.g., `feat(parser): add ability to parse arrays`.

**Breaking Changes:**
Commits that introduce a breaking API change (correlating with a MAJOR version bump) MUST indicate this in the commit message. A breaking change can be part of any type.
It should be indicated at the beginning of the optional body or footer section. A breaking change MUST be written in uppercase: `BREAKING CHANGE:`.

Example:
```
feat: allow provided config object to extend other configs

BREAKING CHANGE: `extends` key in config file is now used for extending other config files
```

Or for a fix:
```
fix(api): correct handling of user IDs

The user ID was previously not validated correctly, leading to potential issues.
This fix ensures proper validation.

BREAKING CHANGE: User ID format is now strictly enforced as UUID.
```

## Pull Request Process
1. Ensure any install or build dependencies are removed before the end of the layer when doing a build.
2. Update the README.md with details of changes to the interface, this includes new environment variables, exposed ports, useful file locations and container parameters.
3. Increase the version numbers in any examples files and the README.md to the new version that this Pull Request would represent. The versioning scheme we use is [SemVer](http://semver.org/).
4. You may merge the Pull Request in once you have the sign-off of two other developers, or if you do not have permission to do that, you may request the second reviewer to merge it for you.

## Code Style
Please follow the existing code style. We use ESLint and Prettier for automated linting and formatting (configurations to be added).

Thank you for your contribution!
