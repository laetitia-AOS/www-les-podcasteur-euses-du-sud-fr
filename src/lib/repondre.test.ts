import { describe, expect, it } from "vitest";
import { COMPTE_EQUIPE, gmailHref, mailtoHref } from "./repondre";

describe("répondre à un message", () => {
  it("Gmail s'ouvre sur un nouveau message adressé à la bonne personne, dans la boîte de l'équipe", () => {
    const u = new URL(gmailHref({ to: "lea+test@exemple.fr", sujet: "Re : Atelier & co" }, COMPTE_EQUIPE));
    expect(u.hostname).toBe("mail.google.com");
    expect(u.searchParams.get("view")).toBe("cm");
    expect(u.searchParams.get("to")).toBe("lea+test@exemple.fr");
    expect(u.searchParams.get("su")).toBe("Re : Atelier & co");
    expect(u.searchParams.get("authuser")).toBe("podcastsdusud@gmail.com");
  });

  it("un objet avec & ou # ne coupe pas le lien de messagerie", () => {
    const href = mailtoHref({ to: "lea@exemple.fr", sujet: "Re : Q&A #2" });
    expect(href).toBe("mailto:lea%40exemple.fr?subject=Re%20%3A%20Q%26A%20%232");
  });

  it("un très long message est raccourci pour que le lien reste utilisable", () => {
    const u = new URL(gmailHref({ to: "a@b.fr", corps: "x".repeat(5000) }));
    expect(u.searchParams.get("body")!.length).toBe(1501);
  });
});
