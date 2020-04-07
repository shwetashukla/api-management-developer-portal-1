import * as ko from "knockout";
import * as Constants from "../../constants";
import template from "./tag-list.html";
import { Component, OnMounted } from "@paperbits/common/ko/decorators";
import { Tag } from "../../models/tag";

@Component({
    selector: "tag-list",
    template: template
})
export class TagList {
    public readonly tags: ko.ObservableArray<Tag>;
    public readonly pattern: ko.Observable<string>;

    constructor() {
        this.tags = ko.observableArray();
        this.pattern = ko.observable();
    }

    @OnMounted()
    public async initialize(): Promise<void> {
        await this.resetSearch();

        this.pattern
            .extend({ rateLimit: { timeout: Constants.defaultInputDelayMs, method: "notifyWhenChangesStop" } })
            .subscribe(this.resetSearch);
    }

    public async loadPageOfTags(): Promise<void> {
        const tag1 = new Tag({ id: "tag1", properties: { displayName: "Tag 1" } });
        const tag2 = new Tag({ id: "tag2", properties: { displayName: "Tag 2" } });
        const tags = [tag1, tag2];

        this.tags(tags);
    }

    public async resetSearch(): Promise<void> {
        // this.page(1);
        this.loadPageOfTags();
    }
}