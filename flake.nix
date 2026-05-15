{
  description = "Node.js + TypeScript development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" "aarch64-darwin" ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      devShells = forAllSystems (system:
        let
          pkgs = import nixpkgs { inherit system; };

          runtimePackages = with pkgs; [
            nodejs_24
            pnpm_10
          ];

          bannerMessage = ''echo "🟢 Node.js $(node --version) + pnpm $(pnpm --version) ready"'';
        in
        {
          default = pkgs.mkShell {
            packages = runtimePackages;
            shellHook = bannerMessage;
          };

          nixos = (pkgs.buildFHSEnv {
            name = "sbpf-xyz";
            targetPkgs = pkgs: runtimePackages;
            runScript = "bash";
            profile = bannerMessage;
          }).env;
        }
      );
    };
}
