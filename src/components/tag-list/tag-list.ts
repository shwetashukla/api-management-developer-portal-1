import * as ko from "knockout";
import template from "./tag-list.html";
import { Component, OnMounted } from "@paperbits/common/ko/decorators";
import { Tag } from "../../models/tag";

@Component({
    selector: "tag-list",
    template: template
})
export class TagList {
    public readonly tags: ko.ObservableArray<Tag>;

    constructor() {
        this.tags = ko.observableArray();
    }

    @OnMounted()
    public async initialize(): Promise<void> {
        const tag1 = new Tag({ id: "tag1", properties: { displayName: "Tag 1" } });
        const tag2 = new Tag({ id: "tag2", properties: { displayName: "Tag 2" } });
        const tags = [tag1, tag2];

        this.tags(tags);
    }
}